/**
 * e-Gov 法令API Version2 クライアント
 * @see https://laws.e-gov.go.jp/api/2/swagger-ui
 */

const BASE_URL = 'https://laws.e-gov.go.jp/api/2';

// 法令種別
export type LawType =
  | 'Constitution'  // 憲法
  | 'Act'           // 法律
  | 'CabinetOrder'  // 政令
  | 'ImperialOrder' // 勅令
  | 'MinisterialOrdinance'  // 府省令
  | 'Rule'          // 規則
  | 'Misc';         // その他

// 法令カテゴリ
export type LawCategory =
  | '010'  // 憲法
  | '020'  // 国会
  | '030'  // 行政組織
  | '040'  // 国家公務員
  | '050'  // 行政手続
  | '060'  // 統計
  | '070'  // 地方自治
  | '080'  // 地方財政
  | '090'  // 司法
  | '100'  // 民事
  | '110'  // 刑事
  | '120'  // 警察
  | '130'  // 消防
  | '140'  // 国土開発
  | '150'  // 土地
  | '160'  // 都市計画
  | '170'  // 道路
  | '180'  // 河川
  | '190'  // 災害対策
  | '200'  // 建築・住宅
  | '210'  // 財務通則
  | '220'  // 国税
  | '230'  // 専売・たばこ
  | '240'  // 国債
  | '250'  // 事業
  | '260'  // 国有財産
  | '270'  // 産業通則
  | '280'  // 工業
  | '290'  // 商業
  | '300'  // 金融・保険
  | '310'  // 外国為替
  | '320'  // 運輸
  | '330'  // 陸運
  | '340'  // 海運
  | '350'  // 航空
  | '360'  // 貨物
  | '370'  // 郵政
  | '380'  // 電気通信
  | '390'  // 労働
  | '400'  // 環境保全
  | '410'  // 厚生
  | '420'  // 社会福祉
  | '430'  // 社会保険
  | '440'  // 教育
  | '450'  // 文化
  | '460'  // 農業
  | '470'  // 林業
  | '480'  // 水産業
  | '490'  // 鉱業
  | '500'  // 電気・ガス
  | '510'  // 外事
  | '520';  // 防衛

// 検索結果アイテム
export interface LawSearchResult {
  lawId: string;
  lawNum: string;
  lawTitle: string;
  lawType: LawType;
  category: string;
  promulgationDate: string;
  effectDate?: string;
  matchedSentences?: {
    articleNum: string;
    articleTitle?: string;
    sentence: string;
    highlightedSentence?: string;
  }[];
}

// キーワード検索レスポンス
export interface KeywordSearchResponse {
  totalCount: number;
  sentenceCount: number;
  items: LawSearchResult[];
  hasError: boolean;
  errorMessage?: string;
}

// 法令タイトル検索レスポンス
export interface TitleSearchResponse {
  totalCount: number;
  items: LawSearchResult[];
  hasError: boolean;
  errorMessage?: string;
}

// 法令本文
export interface LawContent {
  lawId: string;
  lawNum: string;
  lawTitle: string;
  lawType: LawType;
  promulgationDate: string;
  effectDate: string;
  articles: {
    articleNum: string;
    articleTitle?: string;
    paragraphs: {
      paragraphNum: string;
      text: string;
    }[];
  }[];
  hasError: boolean;
  errorMessage?: string;
}

// 検索オプション
export interface SearchOptions {
  lawType?: LawType[];
  category?: LawCategory[];
  asOf?: string;  // YYYY-MM-DD形式
  offset?: number;
  limit?: number;
}

class LawsAPIClient {
  private async makeRequest<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'LifePlanNavigator/1.0',
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 }, // 1時間キャッシュ
      });

      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          if (errorData.code === '404001') {
            return { results: [], total_count: 0, error: 'no_results' } as T;
          }
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[LawsAPI] Request failed:', error);
      throw error;
    }
  }

  private buildUrl(endpoint: string, params: Record<string, string | number | undefined>, pathParam?: string): string {
    const cleanParams: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        cleanParams[key] = String(value);
      }
    }

    const queryString = new URLSearchParams(cleanParams).toString();
    let url = `${BASE_URL}/${endpoint}`;

    if (pathParam) {
      url += `/${encodeURIComponent(pathParam)}`;
    }

    if (queryString) {
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * キーワード検索
   * 法令本文からキーワードを検索し、マッチした条文を返す
   */
  async searchByKeyword(
    keyword: string,
    options: SearchOptions = {}
  ): Promise<KeywordSearchResponse> {
    const { lawType, category, asOf, offset = 0, limit = 10 } = options;

    const params: Record<string, string | number | undefined> = {
      keyword,
      offset,
      limit,
    };

    if (lawType?.length) {
      params.law_type = lawType.join(',');
    }
    if (category?.length) {
      params.category = category.join(',');
    }
    if (asOf) {
      params.asof = asOf;
    }

    try {
      const url = this.buildUrl('laws', params);
      const data = await this.makeRequest<any>(url);

      if (data.error) {
        return {
          totalCount: 0,
          sentenceCount: 0,
          items: [],
          hasError: true,
          errorMessage: data.error === 'no_results' ? '検索結果が見つかりませんでした' : data.message,
        };
      }

      const items: LawSearchResult[] = (data.items || []).map((item: any) => ({
        lawId: item.law_info?.law_id || '',
        lawNum: item.law_info?.law_num || '',
        lawTitle: item.law_info?.law_title || '',
        lawType: item.law_info?.law_type || 'Misc',
        category: item.law_info?.category || '',
        promulgationDate: item.revision_info?.promulgation_date || '',
        matchedSentences: (item.sentences || []).map((s: any) => ({
          articleNum: s.article_info?.article_num || '',
          articleTitle: s.article_info?.article_title,
          sentence: s.sentence || '',
          highlightedSentence: s.highlighted_sentence,
        })),
      }));

      return {
        totalCount: data.total_count || 0,
        sentenceCount: data.sentence_count || 0,
        items,
        hasError: false,
      };
    } catch (error) {
      return {
        totalCount: 0,
        sentenceCount: 0,
        items: [],
        hasError: true,
        errorMessage: error instanceof Error ? error.message : '検索に失敗しました',
      };
    }
  }

  /**
   * 法令タイトル検索
   * 法令名でマッチする法令を検索
   */
  async searchByTitle(
    title: string,
    options: SearchOptions = {}
  ): Promise<TitleSearchResponse> {
    const { lawType, category, asOf, offset = 0, limit = 10 } = options;

    const params: Record<string, string | number | undefined> = {
      law_title: title,
      offset,
      limit,
    };

    if (lawType?.length) {
      params.law_type = lawType.join(',');
    }
    if (category?.length) {
      params.category = category.join(',');
    }
    if (asOf) {
      params.asof = asOf;
    }

    try {
      const url = this.buildUrl('laws', params);
      const data = await this.makeRequest<any>(url);

      if (data.error) {
        return {
          totalCount: 0,
          items: [],
          hasError: true,
          errorMessage: data.error === 'no_results' ? '検索結果が見つかりませんでした' : data.message,
        };
      }

      const items: LawSearchResult[] = (data.laws || data.items || []).map((item: any) => ({
        lawId: item.law_id || item.law_info?.law_id || '',
        lawNum: item.law_num || item.law_info?.law_num || '',
        lawTitle: item.law_title || item.law_info?.law_title || '',
        lawType: item.law_type || item.law_info?.law_type || 'Misc',
        category: item.category || item.law_info?.category || '',
        promulgationDate: item.promulgation_date || item.revision_info?.promulgation_date || '',
      }));

      return {
        totalCount: data.total_count || items.length,
        items,
        hasError: false,
      };
    } catch (error) {
      return {
        totalCount: 0,
        items: [],
        hasError: true,
        errorMessage: error instanceof Error ? error.message : '検索に失敗しました',
      };
    }
  }

  /**
   * 法令本文取得
   * 法令IDから法令の全文を取得
   */
  async getLawContent(lawId: string, asOf?: string): Promise<LawContent> {
    const params: Record<string, string | undefined> = {};
    if (asOf) {
      params.asof = asOf;
    }

    try {
      const url = this.buildUrl('laws', params, lawId);
      const data = await this.makeRequest<any>(url);

      if (data.error) {
        return {
          lawId: '',
          lawNum: '',
          lawTitle: '',
          lawType: 'Misc',
          promulgationDate: '',
          effectDate: '',
          articles: [],
          hasError: true,
          errorMessage: data.message || '法令の取得に失敗しました',
        };
      }

      // 法令本文をパース（実際のAPIレスポンス構造に合わせて調整が必要）
      return {
        lawId: data.law_info?.law_id || lawId,
        lawNum: data.law_info?.law_num || '',
        lawTitle: data.law_info?.law_title || '',
        lawType: data.law_info?.law_type || 'Misc',
        promulgationDate: data.revision_info?.promulgation_date || '',
        effectDate: data.revision_info?.effect_date || '',
        articles: [], // 実際のAPIレスポンスに応じてパース
        hasError: false,
      };
    } catch (error) {
      return {
        lawId: '',
        lawNum: '',
        lawTitle: '',
        lawType: 'Misc',
        promulgationDate: '',
        effectDate: '',
        articles: [],
        hasError: true,
        errorMessage: error instanceof Error ? error.message : '法令の取得に失敗しました',
      };
    }
  }
}

// シングルトンインスタンス
export const lawsApiClient = new LawsAPIClient();

// デフォルトエクスポート
export default lawsApiClient;
