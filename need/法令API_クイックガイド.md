# 法令API クイックガイド

## 概要

e-Gov法令APIは、日本の法令データを取得できる**無料・認証不要**の公開APIです。

- **提供元**: デジタル庁
- **公式サイト**: https://laws.e-gov.go.jp/apitop/
- **データ形式**: XML（Version 2ではJSONも対応）

---

## できること

| 機能 | 説明 |
|------|------|
| 法令一覧取得 | 全法令/憲法・法律/政令/府省令の一覧を取得 |
| 法令全文取得 | 特定の法令の全条文をXMLで取得 |
| 条文取得 | 特定の条・項を指定して取得 |
| 更新情報取得 | 指定日に更新された法令の一覧 |

---

## APIエンドポイント（Version 1）

**ベースURL**: `https://laws.e-gov.go.jp/api/1`

### 1. 法令一覧取得

```
GET /lawlists/{category}
```

| category | 内容 |
|----------|------|
| 1 | 全法令 |
| 2 | 憲法・法律 |
| 3 | 政令・勅令 |
| 4 | 府省令 |

**例**: 憲法・法律の一覧
```
https://laws.e-gov.go.jp/api/1/lawlists/2
```

### 2. 法令全文取得

```
GET /lawdata/{law_id}
```

**例**: 民法の全文
```
https://laws.e-gov.go.jp/api/1/lawdata/129AC0000000089
```

### 3. 条文取得

```
GET /articles;lawId={law_id};article={条番号};paragraph={項番号};
```

**例**: 民法709条（不法行為）
```
https://laws.e-gov.go.jp/api/1/articles;lawId=129AC0000000089;article=709;
```

### 4. 更新法令一覧

```
GET /updatelawlists/{YYYYMMDD}
```

**例**: 2024年11月1日の更新
```
https://laws.e-gov.go.jp/api/1/updatelawlists/20241101
```

---

## よく使う法令ID

| 法令名 | 法令ID |
|-------|--------|
| 日本国憲法 | 321CONSTITUTION |
| 民法 | 129AC0000000089 |
| 刑法 | 140AC0000000045 |
| 商法 | 132AC0000000048 |
| 会社法 | 417AC0000000086 |
| 労働基準法 | 322AC0000000049 |
| 個人情報保護法 | 415AC0000000057 |
| 著作権法 | 345AC0000000048 |
| 建築基準法 | 325AC0000000201 |
| 道路交通法 | 335AC0000000105 |

---

## 実行例

### ブラウザで試す

以下のURLをブラウザに貼り付けるだけで結果が見られます：

1. **日本国憲法9条**
   ```
   https://laws.e-gov.go.jp/api/1/articles;lawId=321CONSTITUTION;article=9;
   ```

2. **民法1条（基本原則）**
   ```
   https://laws.e-gov.go.jp/api/1/articles;lawId=129AC0000000089;article=1;
   ```

3. **刑法199条（殺人）**
   ```
   https://laws.e-gov.go.jp/api/1/articles;lawId=140AC0000000045;article=199;
   ```

### Pythonで試す

```python
import requests
import xml.etree.ElementTree as ET

# 民法709条を取得
url = "https://laws.e-gov.go.jp/api/1/articles;lawId=129AC0000000089;article=709;"
response = requests.get(url)
root = ET.fromstring(response.content)

for sentence in root.findall(".//Sentence"):
    print(sentence.text)

# 出力: 故意又は過失によって他人の権利又は法律上保護される利益を
#       侵害した者は、これによって生じた損害を賠償する責任を負う。
```

### curlで試す

```bash
curl "https://laws.e-gov.go.jp/api/1/articles;lawId=129AC0000000089;article=709;"
```

---

## レスポンス例（XML）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<DataRoot>
  <ApplData>
    <Article Num="709">
      <ArticleCaption>（不法行為による損害賠償）</ArticleCaption>
      <Paragraph Num="1">
        <ParagraphNum/>
        <ParagraphSentence>
          <Sentence>故意又は過失によって他人の権利又は
          法律上保護される利益を侵害した者は、これによって
          生じた損害を賠償する責任を負う。</Sentence>
        </ParagraphSentence>
      </Paragraph>
    </Article>
  </ApplData>
</DataRoot>
```

---

## 注意事項

- **アクセス制限**: 大量アクセスやBOTアクセスは制限される場合あり
- **負荷テスト禁止**: 意図的な負荷テストは控える
- **一部取得不可**: 所得税法など別表が多い法律は取得できない場合あり

---

## 参考リンク

| リンク | 内容 |
|-------|------|
| [法令API公式](https://laws.e-gov.go.jp/apitop/) | 公式トップページ |
| [API仕様書PDF](https://laws.e-gov.go.jp/file/houreiapi_shiyosyo.pdf) | Version 1 詳細仕様 |
| [Swagger UI](https://laws.e-gov.go.jp/api/2/swagger-ui) | Version 2 API（ブラウザで試せる） |
| [e-Gov法令検索](https://laws.e-gov.go.jp/) | 法令検索サイト |

---

*作成日: 2025-12-09*
