import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 캐시 방지 (항상 최신 DB 조회)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. DB에서 최신 데이터 1개 조회
    const { data, error } = await supabase
      .from('market_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    // 2. 데이터가 없는 경우 (방탄 처리)
    if (!data || data.length === 0) {
      console.log("⚠️ DB가 비어있습니다. 더미 데이터를 반환합니다.");
      return NextResponse.json({
        marketData: {
          us10y: { price: 0, changePercent: 0 },
          usdjpy: { price: 0, changePercent: 0 },
          bitcoin: { price: 0, changePercent: 0 },
          wti: { price: 0, changePercent: 0 },
          vix: { price: 0, changePercent: 0 },
          dxy: { price: 0, changePercent: 0 },
          tga: { price: 0, changePercent: 0 },
          highYield: { price: 0, changePercent: 0 },
          sofr: { price: 0, changePercent: 0 },
          breakeven: { price: 0, changePercent: 0 },
          fedWatch: { price: 0, changePercent: 0 },
          cnnIndex: { price: 0, changePercent: 0 }
        },
        aiAnalysis: {
          status: "대기",
          summary: ["아직 수집된 데이터가 없습니다.", "api/cron 을 실행해주세요.", "잠시 후 업데이트됩니다."]
        }
      });
    }

    // 3. 정상 데이터 반환
    const latestLog = data[0];
    return NextResponse.json({
      marketData: latestLog.market_data,
      aiAnalysis: latestLog.ai_analysis,
      lastUpdated: latestLog.created_at || latestLog.timestamp || null
    });

  } catch (error: any) {
    console.error("🔥 API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
