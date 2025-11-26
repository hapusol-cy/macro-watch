import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("🤖 CRON: 데이터 수집 및 분석 시작...");
  
  const collectionReport: any = {}; // 수집 결과 리포트

  // 1. 야후 라이브러리 로드
  let yahooFinance;
  try {
    const pkg = require('yahoo-finance2');
    const yfImport = pkg.default || pkg;
    yahooFinance = (typeof yfImport === 'function') ? new yfImport() : yfImport;
    if(yahooFinance.suppressNotices) yahooFinance.suppressNotices(['yahooSurvey', 'nonsensical']);
  } catch (e) { console.error("Yahoo Import Error"); }

  try {
    const GOOGLE_KEY = process.env.GOOGLE_API_KEY!;
    const FRED_KEY = process.env.FRED_API_KEY!;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // ---------------------------------------------------------
    // 2. CNN Fear & Greed (헤더 우회 시도)
    // ---------------------------------------------------------
    let cnnScore = 0;
    let isCnnFetched = false;
    try {
      const cnnRes = await axios.get("https://production.dataviz.cnn.io/index/fearandgreed/graphdata", {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 5000
      });
      if (cnnRes.data?.fear_and_greed?.score) {
        cnnScore = Math.round(cnnRes.data.fear_and_greed.score);
        isCnnFetched = true;
        collectionReport['CNN'] = "✅ Real API";
      }
    } catch (e) { 
      collectionReport['CNN'] = "⚠️ Fetch Failed (Will use AI)";
    }

    // ---------------------------------------------------------
    // 3. 야후 파이낸스
    // ---------------------------------------------------------
    const symbols = [
      { ticker: '^TNX', name: 'us10y' },
      { ticker: 'JPY=X', name: 'usdjpy' },
      { ticker: 'BTC-USD', name: 'bitcoin' },
      { ticker: 'CL=F', name: 'wti' },
      { ticker: '^VIX', name: 'vix' },
      { ticker: 'DX-Y.NYB', name: 'dxy' }
    ];

    const marketResults: any = {};
    await Promise.all(symbols.map(async (item) => {
      try {
        const quote = await yahooFinance.quote(item.ticker);
        marketResults[item.name] = {
          price: quote.regularMarketPrice || 0,
          changePercent: quote.regularMarketChangePercent || 0
        };
        collectionReport[item.name] = "✅ Yahoo";
      } catch (e) { 
        marketResults[item.name] = { price: 0, changePercent: 0 }; 
        collectionReport[item.name] = "❌ Failed";
      }
    }));

    // ---------------------------------------------------------
    // 4. FRED 데이터
    // ---------------------------------------------------------
    const getFredData = async (seriesId: string, name: string) => {
      try {
        const res = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=1`);
        const val = parseFloat(res.data.observations?.[0]?.value || '0');
        collectionReport[name] = "✅ FRED";
        return val;
      } catch (e) { 
        collectionReport[name] = "❌ Failed";
        return 0; 
      }
    };

    const tga = await getFredData('WTREGEN', 'tga');
    const highYield = await getFredData('BAMLH0A0HYM2', 'highYield');
    const sofr = await getFredData('SOFR', 'sofr');
    const breakeven = await getFredData('T10YIE', 'breakeven');

    // ---------------------------------------------------------
    // 5. AI 분석 (Full Data)
    // ---------------------------------------------------------
    let aiAnalysis = { 
      status: "중립", 
      summary: ["데이터 분석 중..."],
      estimated_fed_prob: 50,
      estimated_cnn_score: 50 
    };

    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `
        금융 전문가로서 데이터를 분석해.

        [시장 데이터]
        - 미국10년물: ${marketResults.us10y?.price}%, DXY: ${marketResults.dxy?.price}
        - 엔달러: ${marketResults.usdjpy?.price}, SOFR: ${sofr}, 기대인플레: ${breakeven}
        - VIX: ${marketResults.vix?.price}, 하이일드: ${highYield}
        - 유가: ${marketResults.wti?.price}, 비트코인: ${marketResults.bitcoin?.price}
        - TGA잔고: ${tga}
        - CNN공포지수(실측): ${isCnnFetched ? cnnScore : '수집실패(추정필요)'}

        [요청]
        1. 단순 나열 금지. 지표 간 연관성 분석.
        2. 시장 상태 [위험/주의/중립/긍정/과열] 택1.
        3. 3줄 요약 (핵심/영향/전략).
        4. FedWatch(금리동결확률 0~100) 추정.
        5. CNN 점수(0~100) 추정 (실측값 없으면 VIX 보고 추정).

        [JSON 포맷]
        { "status":"", "summary":[], "estimated_fed_prob":0, "estimated_cnn_score":0 }
      `;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, '').trim();
      aiAnalysis = JSON.parse(text);
      collectionReport['AI_Analysis'] = "✅ Gemini 2.5";
      
    } catch (e: any) {
      console.error("AI Error:", e.message);
      collectionReport['AI_Analysis'] = "❌ Failed";
    }

    // ---------------------------------------------------------
    // 6. 데이터 조립 (여기가 누락됐던 부분!)
    // ---------------------------------------------------------
    const finalCnnScore = isCnnFetched ? cnnScore : aiAnalysis.estimated_cnn_score;
    const finalFedProb = aiAnalysis.estimated_fed_prob;

    // 🔥 [중요] finalMarketData 변수 정의
    const finalMarketData = { 
      ...marketResults, 
      tga: { price: tga, changePercent: 0 }, 
      highYield: { price: highYield, changePercent: 0 },
      sofr: { price: sofr, changePercent: 0 },
      breakeven: { price: breakeven, changePercent: 0 },
      fedWatch: { price: finalFedProb, changePercent: 0 },
      cnnIndex: { price: finalCnnScore, changePercent: 0 } 
    };

    collectionReport['CNN_Source'] = isCnnFetched ? "Real API" : "AI Estimated";

    // ---------------------------------------------------------
    // 7. DB 저장
    // ---------------------------------------------------------
    const { error } = await supabase
      .from('market_logs')
      .insert([{ market_data: finalMarketData, ai_analysis: aiAnalysis }]);

    if (error) throw error;

    return NextResponse.json({ 
      message: "Data Saved", 
      report: collectionReport, 
      data: finalMarketData 
    });

  } catch (error: any) {
    console.error("🔥 CRON Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}