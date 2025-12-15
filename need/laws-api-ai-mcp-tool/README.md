# 法令API Version2 - AI連携用MCPツール

法令API Version2をAIエージェントから効果的に活用するための参照実装（MCP Server）です。

## 概要

このツールは、日本の法令データを提供する[e-Gov法令検索](https://laws.e-gov.go.jp/)の[法令API Version2](https://laws.e-gov.go.jp/api/2/swagger-ui)をAIエージェントから利用するためのMCP（Model Context Protocol）サーバーです。ハッカソンイベントでの参照実装として、以下の機能を提供します：

- **キーワード検索**: 法令本文から関連する条文を検索
- **法令名検索**: 法令タイトルで法令を検索
- **法令本文取得**: 法令IDから全文・条文を取得
- **検索結果分析**: 検索結果を分析し、次のアクションを提案
- **検索ガイダンス**: 効果的な法令検索の段階的アプローチを提供

## 特徴

✅ **AI最適化設計**: 自然言語クエリから法令情報を効率的に取得  
✅ **段階的検索戦略**: 初期検索→分析→深掘りの体系的アプローチ  
✅ **表記揺れ対応**: API側で対応していない表記揺れをAI側で考慮  
✅ **参照実装**: ハッカソン参加者がカスタマイズしやすい構造  
✅ **Pure Python**: 標準ライブラリ + FastMCPのみで動作  

## 重要な設計思想：表記揺れへの対応

### 背景

**法令API Version2はキーワード検索において表記揺れを考慮していません。** これは、法令文書の正確性を重視する設計思想に基づいています。

### 実際の検索結果による検証

実際にAPIで検索した結果、表記の違いにより大きな差が生じることが確認されています：

#### 検索比較：「座席ベルト」vs「シートベルト」

| キーワード | ヒット件数 | 主な法令 | 内容 |
|----------|---------|---------|------|
| **座席ベルト** | **37件** | 道路交通法<br>道路運送車両法施行令<br>道路交通法施行令 | ✅ 運転者・同乗者の着用義務<br>✅ 幼児用補助装置の規定<br>✅ 義務免除の条件 |
| **シートベルト** | **8件** | 関税定率法<br>火薬類取締法施行規則<br>労働安全衛生規則 | ❌ 輸入品の分類（関税）<br>❌ ガス発生器の規定<br>❌ 作業機械の安全規則 |

#### 具体例：「座席ベルト」で検索した場合

```json
{
  "law_title": "道路交通法",
  "text": "自動車の運転者は、座席ベルトを装着しない者を運転者席以外の
          乗車装置に乗車させて自動車を運転してはならない。ただし、
          幼児（適切に座席ベルトを装着させるに足りる座高を有するもの
          を除く。）を当該乗車装置に乗車させるとき..."
}
```

✅ **正しい情報**: 交通法規における着用義務が取得できる

#### 具体例：「シートベルト」で検索した場合

```json
{
  "law_title": "関税定率法",
  "text": "八七〇八・二一　シートベルト"
}
```

❌ **関係ない情報**: 関税分類の情報のみで、着用義務に関する情報は得られない

### 重要な示唆

一般ユーザーが「シートベルトの着用義務について教えて」と質問した場合：

- ❌ **「シートベルト」で検索** → 関税法や労働安全衛生規則がヒット（質問に答えられない）
- ✅ **「座席ベルト」で検索** → 道路交通法がヒット（正しい回答が可能）

**このため、AI側で表記揺れを考慮する設計が不可欠です。**

### このツールの対応方針

**AI側で表記揺れを考慮する設計**にしています：

1. **AIエージェントが複数の表記で検索を試行**
   - ユーザーの自然言語クエリから一般的な表現を抽出
   - 法令用語への変換を試行（例：「シートベルト」→「座席ベルト」）
   - 結果が0件または不適切な場合、類義語で再検索

2. **段階的検索ガイダンスで戦略を提示**
   - `get_search_guidance()`で表記揺れへの対処方法を明示
   - よくある表記揺れのパターンを例示

3. **検索結果分析で次のアクションを提案**
   - `analyze_search_results()`が検索結果を評価
   - 結果が0件または関連性が低い場合、代替キーワードを提案

### ハッカソン参加者へのメッセージ

この設計は**あくまで参照実装の一例**です。以下のようなアプローチも可能です：

- **辞書ベースの変換**: 一般用語→法令用語の変換辞書を作成
- **機械学習モデル**: 類義語検索や意味的類似性を活用
- **検索結果の文脈分析**: ヒットした法令が質問に関連しているか判定
- **ユーザーフィードバック**: 検索結果からユーザーが適切な用語を学習
- **複数キーワードの並列検索**: 考えられる表記を一度に試行し、最適な結果を選択

法令検索APIの特性を理解した上で、独自のアプローチを実装してみてください！

## 必要要件

- Python 3.8以上
- `mcp` パッケージ（FastMCP）

## インストール

### 1. 依存パッケージのインストール

```bash
pip install mcp
```

### 2. MCPサーバーの配置

```bash
# MCPツールディレクトリに配置（例）
mkdir -p ~/mcp-servers
cp laws-api-ai-mcp-tool.py ~/mcp-servers/
```
※パスはご利用の環境に応じて指定してください

### 3. MCP設定ファイルの編集

使用するAIツール（Claude Desktop、Cline等）の設定ファイルにMCPサーバーを追加します。

#### Claude Desktop の場合

`~/Library/Application Support/Claude/claude_desktop_config.json` に追加：

```json
{
  "mcpServers": {
    "laws-api": {
      "command": "python",
      "args": ["/path/to/laws-api-ai-mcp-tool.py"]
    }
  }
}
```
※パスはご利用の環境に応じて指定してください

#### その他のMCP対応ツール

各ツールのドキュメントに従ってMCPサーバーを登録してください。

## 使い方

### 基本的な使用フロー

AIエージェントは以下の流れで法令検索を実行します：

```
1. get_search_guidance() でガイダンスを確認
   ↓
2. search_laws_by_keyword() で初期検索
   ↓
3. analyze_search_results() で結果を分析
   ↓
4. 必要に応じて追加検索（定義の確認、参照法令の検索等）
   ↓
5. get_law_content() で詳細な条文を取得
```

### 提供されるツール

#### 1. `get_search_guidance()`

効果的な法令検索の段階的アプローチガイダンスを取得します。

**使用例**:
```python
# AIエージェントが最初に呼び出すべきツール
guidance = get_search_guidance()
```

#### 2. `search_laws_by_keyword(keywords, limit=10, offset=0, ...)`

キーワードで法令本文を検索します。

**パラメータ**:
- `keywords`: 検索キーワードのリスト（AND検索）
- `limit`: 取得件数上限（デフォルト: 10）
- `offset`: 取得開始位置（ページング用）
- `law_type`: 法令種別フィルタ（`["Act"]`, `["CabinetOrder"]`等）
- `date_from`: 公布日開始（YYYY-MM-DD）
- `date_to`: 公布日終了（YYYY-MM-DD）

**使用例**:
```python
# 「シートベルト」「着用」で検索
results = search_laws_by_keyword(
    keywords=["シートベルト", "着用"],
    limit=10
)
```

#### 3. `search_laws_by_title(title_keywords, limit=10, ...)`

法令名で法令を検索します。

**パラメータ**:
- `title_keywords`: 法令名に含まれるキーワードのリスト
- `limit`: 取得件数上限
- `law_type`: 法令種別フィルタ
- `include_repealed`: 廃止法令を含むか（デフォルト: False）

**使用例**:
```python
# 「道路交通法」を検索
results = search_laws_by_title(
    title_keywords=["道路交通法"]
)
```

#### 4. `get_law_content(law_id, extract_articles=True, target_date=None)`

法令IDから法令本文を取得します。

**パラメータ**:
- `law_id`: 法令ID（検索結果から取得）
- `extract_articles`: 条文を抽出して構造化するか（デフォルト: True）
- `target_date`: 時点指定（YYYY-MM-DD）

**使用例**:
```python
# 法令IDから条文を取得
content = get_law_content(
    law_id="322AC0000000105",
    extract_articles=True
)
```

#### 5. `analyze_search_results(search_results, original_query)`

検索結果を分析し、関連性や次のアクションを提案します。

**パラメータ**:
- `search_results`: 検索結果のリスト
- `original_query`: 元の検索クエリ

**使用例**:
```python
# 検索結果を分析
analysis = analyze_search_results(
    search_results=results["items"],
    original_query="5歳の子供はシートベルトが必要か"
)
```

## 検索戦略のベストプラクティス

### 1. 表記揺れへの対応

**重要**: 法令API Version2はキーワード検索で表記揺れを考慮しません。AI側で複数の表記を試す必要があります。

同じ概念でも法令により表記が異なる場合があります：

| 一般的な表現 | 法令での表記 | 検索戦略 | 備考 |
|------------|------------|---------|------|
| シートベルト | 座席ベルト | 両方で検索を試行し、文脈に合う結果を選択 | 「シートベルト」は関税法等でヒット |
| 自動車 | 車両、車 | 「車両」で検索後、必要に応じて「車」でも検索 | 法令により使い分けられている |
| 道路 | 道 | 「道路」で検索後、結果が少なければ「道」でも検索 | 「道路法」等では「道路」が使われる |
| 子供 | 児童、幼児 | 年齢区分の定義を確認してから検索 | 年齢により区分が異なる |

**実装例**:
```python
# 1回目: 一般的な表現で検索
results1 = search_laws_by_keyword(keywords=["シートベルト", "着用"])

# 結果を分析して関連性を確認
analysis = analyze_search_results(results1["items"], "シートベルトの着用義務")

# 関連性が低い場合、法令用語で再検索
if not is_relevant(analysis):
    results2 = search_laws_by_keyword(keywords=["座席ベルト", "着用"])
```

### 2. 年齢に関する検索

年齢に関する質問の場合：

1. 対象の活動・規定をキーワード検索
2. 年齢区分（幼児、児童等）を含む条文を特定
3. 年齢区分の定義を他の法令で検索

**よく使われる年齢区分**:
- 「幼児」→ 児童福祉法で定義を検索
- 「児童」→ 児童福祉法、学校教育法で定義を検索
- 「未成年」→ 民法で定義を検索
- 「少年」→ 少年法で定義を検索

### 3. 段階的な検索

```
広い検索 → 結果が多すぎる → キーワードを追加して絞り込み
狭い検索 → 結果が0件 → キーワードを減らして再検索
```

### 4. 検索結果が0件の場合の対処

1. **キーワードを減らす**: AND検索なので、キーワードが多いと結果が絞られすぎる
2. **類義語・法令用語で試す**: 一般的な表現→法令用語に変換
3. **法令名で直接検索**: 関連する法令が分かっている場合は`search_laws_by_title`を使用
4. **部分的なキーワードで検索**: 「座席ベルト着用義務」→「座席ベルト」のみで検索

### 5. 検索結果の関連性を確認

ヒット件数が多くても、質問に関連しない法令がヒットしている可能性があります：

```python
# 検索結果の法令タイトルを確認
for item in results["items"]:
    print(f"法令: {item['law_title']}")
    
# 期待: 「道路交通法」
# 実際: 「関税定率法」← 質問とは無関係
```

このような場合、キーワードを変更して再検索する必要があります。

## カスタマイズ方法

このツールは参照実装として提供されており、ハッカソン参加者が自由にカスタマイズできます。

### 1. 新しいツールの追加

```python
@mcp.tool()
def your_custom_tool(param1: str, param2: int) -> str:
    """
    カスタムツールの説明
    
    Parameters:
    param1: パラメータ1の説明
    param2: パラメータ2の説明
    
    Returns:
    str: 結果（JSON形式）
    """
    # 実装
    return json.dumps(result, ensure_ascii=False)
```

### 2. 表記揺れ辞書の実装例

API側で表記揺れが考慮されないため、辞書ベースの変換を実装できます：

```python
# 一般用語 → 法令用語の変換辞書
TERM_DICTIONARY = {
    "シートベルト": ["座席ベルト"],
    "自動車": ["車両", "車"],
    "子供": ["児童", "幼児"],
    # ... 必要に応じて追加
}

@mcp.tool()
def smart_keyword_search(keywords: List[str], limit: int = 10) -> str:
    """表記揺れを考慮した賢い検索"""
    all_results = []
    
    # 元のキーワードで検索
    results = search_laws_by_keyword(keywords, limit)
    all_results.append(results)
    
    # 表記揺れがある場合、代替表記でも検索
    for keyword in keywords:
        if keyword in TERM_DICTIONARY:
            for alt_keyword in TERM_DICTIONARY[keyword]:
                alt_results = search_laws_by_keyword(
                    [alt_keyword] + [k for k in keywords if k != keyword],
                    limit
                )
                all_results.append(alt_results)
    
    # 結果をマージして返す
    return merge_and_deduplicate(all_results)
```

### 3. 検索結果の関連性判定

検索結果が質問に関連しているかを判定する機能を追加できます：

```python
def is_traffic_related(law_title: str) -> bool:
    """交通関連の法令かどうかを判定"""
    traffic_keywords = ["道路", "交通", "車両", "運転", "運送"]
    return any(keyword in law_title for keyword in traffic_keywords)

@mcp.tool()
def smart_search_with_relevance(query: str, keywords: List[str]) -> str:
    """関連性を考慮した検索"""
    # 初回検索
    results = search_laws_by_keyword(keywords)
    
    # 交通に関する質問なのに交通関連法令がヒットしない場合
    if "シートベルト" in query or "運転" in query:
        if not any(is_traffic_related(item["law_title"]) 
                   for item in results["items"]):
            # 法令用語で再検索
            alt_keywords = [TERM_DICTIONARY.get(k, k) for k in keywords]
            results = search_laws_by_keyword(alt_keywords)
    
    return results
```

### 4. レスポンスフォーマットのカスタマイズ

`ResponseFormatter`クラスの`format_search_results()`メソッドを修正することで、検索結果の構造を変更できます。

### 5. 検索ロジックの拡張

`analyze_search_results()`関数を拡張して、より高度な分析機能を追加できます。

## トラブルシューティング

### 検索結果が0件の場合

**原因**: 法令APIは表記揺れを考慮しないため、一般的な表現では検索できない場合があります。

**対処法**:
1. キーワードを減らして再検索
2. 類義語や法令用語で検索（例：「シートベルト」→「座席ベルト」）
3. 法令名で直接検索（`search_laws_by_title`）
4. より広い概念で検索（例：「座席ベルト着用義務」→「座席ベルト」のみ）

### 検索結果が質問と無関係な場合

**原因**: 同じ用語でも異なる文脈で使用されている場合があります（例：「シートベルト」→関税法でヒット）。

**対処法**:
1. 検索結果の法令タイトルを確認
2. 質問の文脈に合わない場合、キーワードを変更
3. 法令用語への変換を試行
4. 法令名を指定して検索

### エラーが発生する場合

- APIのタイムアウト（30秒）を確認
- ネットワーク接続を確認
- 法令IDが正しいか確認

### 文字化けする場合

レスポンスは全てUTF-8でエンコードされています。ターミナルの文字コード設定を確認してください。

## API制限事項

e-Gov法令検索の法令API Version2の利用規約等に従ってください：

- **表記揺れ非対応**: キーワード検索は完全一致ベース（AI側で対応が必要）
- **過度なリクエストは避ける**: 連続した検索を行う場合は適切な間隔を設ける
- **商用利用**: 利用規約を確認
- **タイムアウト**: APIの応答時間を考慮（このツールでは30秒に設定）

詳細は[法令API Vesion2](https://laws.e-gov.go.jp/api/2/swagger-ui)の公式ドキュメントを参照してください。

## ライセンス

このツールはハッカソンイベントの参照実装として提供されています。  
自由に改変・再配布していただいて構いません。

## サポート

ハッカソンイベント期間中のサポートについては、イベント運営チームにお問い合わせください。

## 参考リンク

- [e-Gov法令検索](https://laws.e-gov.go.jp/)
- [法令API Vesion2 ドキュメント](https://laws.e-gov.go.jp/api/2/swagger-ui)
- [法令データ ドキュメンテーション（α版）](https://laws.e-gov.go.jp/docs/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

---

**Happy Hacking! 🚀**
