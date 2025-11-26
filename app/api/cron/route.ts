import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("🤖 CRON: 뉴스 기반 정밀 분석 시작...");
  
  const collectionReport: any = {};

  // 1. 야후 라이브러리 준비
  let yahooFinance: any;
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
    // 2. CNN Fear & Greed
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
    } catch (e) { collectionReport['CNN'] = "⚠️ AI Estimate"; }

    // ---------------------------------------------------------
    // 3. 야후 파이낸스 데이터 (숫자)
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
        collectionReport[item.name] = "✅ OK";
      } catch (e) { 
        marketResults[item.name] = { price: 0, changePercent: 0 }; 
        collectionReport[item.name] = "❌ Fail";
      }
    }));

    // ---------------------------------------------------------
    // 3-1. ⭐ [핵심 추가] 최신 뉴스 헤드라인 가져오기
    // ---------------------------------------------------------
    let newsHeadlines = "";
    try {
      // 'Federal Reserve' 키워드로 관련 뉴스 검색
      const newsResult = await yahooFinance.search("Federal Reserve", { newsCount: 5 });
      if (newsResult.news && newsResult.news.length > 0) {
        newsHeadlines = newsResult.news.map((n: any) => `- ${n.title}`).join("\n");
        collectionReport['News'] = `✅ Fetched ${newsResult.news.length} headlines`;
      } else {
        newsHeadlines = "뉴스 수집 실패 (데이터 분석 위주로 진행하세요)";
        collectionReport['News'] = "⚠️ No Data";
      }
    } catch (e) {
      newsHeadlines = "뉴스 수집 중 에러 발생";
      collectionReport['News'] = "❌ Error";
    }

    // ---------------------------------------------------------
    // 4. FRED 데이터
    // ---------------------------------------------------------
    const getFredData = async (seriesId: string, name: string) => {
      try {
        const res = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=1`);
        const val = parseFloat(res.data.observations?.[0]?.value || '0');
        collectionReport[name] = "✅ OK";
        return val;
      } catch (e) { return 0; }
    };

    const tga = await getFredData('WTREGEN', 'tga');
    const highYield = await getFredData('BAMLH0A0HYM2', 'highYield');
    const sofr = await getFredData('SOFR', 'sofr');
    const breakeven = await getFredData('T10YIE', 'breakeven');

    // ---------------------------------------------------------
    // 5. AI 분석 (뉴스 데이터 포함!)
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
        당신은 월가 최고의 거시경제 전략가입니다. 아래 데이터를 종합하여 시장을 분석하세요.

        [1. 수치 데이터]
        - 10년물 금리: ${marketResults.us10y?.price}%
        - VIX: ${marketResults.vix?.price}
        - 유가: ${marketResults.wti?.price}$
        - CNN공포지수(실측): ${isCnnFetched ? cnnScore : '없음'}

        [2. ⭐ 최신 뉴스 헤드라인 (Fed 발언/시장 분위기)]
        ${newsHeadlines}

        [요청사항]
        1. **뉴스 분석 반영**: 위 뉴스 헤드라인에 연준(Fed) 위원의 매파/비둘기파 발언이 있다면 금리 확률 추정에 가중치를 두세요.
        2. 시장 상태 판정 [위험/주의/중립/긍정/과열].
        3. 3줄 요약 (뉴스 내용이 중요하다면 요약에 포함할 것).
        4. **FedWatch 확률 추정**: 금리와 **뉴스 분위기**를 고려하여 금리 동결(또는 인하) 확률(0~100%)을 추정하세요. (예: 매파적 발언이 많으면 확률을 낮출 것)
        5. CNN 점수 추정 (실측값 없으면 추정).

        [JSON 포맷]
        { "status":"", "summary":[], "estimated_fed_prob":0, "estimated_cnn_score":0 }
      `;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, '').trim();
      aiAnalysis = JSON.parse(text);
      collectionReport['AI_Analysis'] = "✅ Gemini 2.5 (With News)";
      
    } catch (e: any) {
      collectionReport['AI_Analysis'] = "❌ Failed";
    }

    const finalCnnScore = isCnnFetched ? cnnScore : aiAnalysis.estimated_cnn_score;
    const finalFedProb = aiAnalysis.estimated_fed_prob;

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}