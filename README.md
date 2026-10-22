# yukisiro — Personal Website

GitHub Pagesで無料公開できる、シンプルだけど少しデザインにこだわった個人サイトです。

## ページ構成

- `index.html` — Home（自己紹介、興味分野、最新の記事）
- `articles.html` — Articles（一覧、検索、タグでの絞り込み）
- `about.html` — About（自己紹介、SNSリンク）
- `article.html` — 記事詳細（Markdownファイルを読み込み）
- `styles.css` — すべてのページ共通のデザイン
- `app.js` — SNSリンク、記事の表示、Markdown変換
- `posts/index.json` — 記事の一覧・タイトル・日付・タグ
- `posts/*.md` — 各記事の本文

外部API、サーバー、ビルドは必要ありません。記事を読む機能は JavaScript の `fetch()` を使っています。

※Webフォント（Google Fonts）の読み込みのみ外部通信です。ネットワークがない場合はOS標準のフォントを使います。外部通信をゼロにしたい場合は `styles.css` の先頭の `@import` 行を削除してください。

## 1. 自分のプロフィールにする

`app.js` 冒頭の `SITE.links` に、自分のGitHubとXのURLを入力してください。

```js
links: [
  { label: "GitHub", url: "https://github.com/自分のユーザー名", type: "github" },
  { label: "X (Twitter)", url: "https://x.com/自分のユーザー名", type: "x" },
  { label: "AtCoder", url: "https://atcoder.jp/users/yukisiro", type: "atcoder" }
]
```

未入力（空文字）のリンクは表示されません。**XやGitHubのURLは未設定です。**

自己紹介は `index.html` と `about.html` を直接書き換えてください。サンプル記事は公開前に編集・削除してください。

## 2. 記事の書き方

1. `posts/` に `new-article.md` のようなMarkdownファイルを作る。
2. `posts/index.json` に記事情報を追加する。

```json
{
  "slug": "new-article",
  "title": "新しい記事のタイトル",
  "date": "2026-10-22",
  "description": "この記事の短い説明です。",
  "tags": ["C++", "学習メモ"]
}
```

`slug` と Markdown のファイル名（拡張子を除いた部分）は同じにしてください。英小文字・数字・ハイフンに対応しています。日付の新しい順に自動で並びます。

Markdownは見出し、段落、太字、斜体、リンク、リスト、引用、コードブロックに対応しています。記事内の生のHTMLや画像記法など、高度なMarkdown機能は未対応です。

記事のURLの例：`https://ユーザー名.github.io/article.html?post=new-article`

## 3. PCで動作確認

`index.html` を直接ダブルクリックしても、ブラウザのセキュリティ設定により記事が読み込めないことがあります。フォルダ内でローカルサーバーを起動してください。

```bash
python -m http.server 8000
```

そして `http://localhost:8000` を開きます。

## 4. GitHub Pagesで無料公開

1. GitHubで `ユーザー名.github.io` という名前の **Public** リポジトリを作成。
2. **このフォルダの中のファイル一式** を、リポジトリのルートへアップロード。
3. `Settings` → `Pages` → `Build and deployment` → `Deploy from a branch` を選択。
4. `main` ブランチ、`/(root)` に設定して保存。
5. `https://ユーザー名.github.io/` に公開されます。

プロジェクトリポジトリ `portfolio` などに置く場合でも、ページ内の相対パスは対応します。その場合、URLは通常 `https://ユーザー名.github.io/portfolio/` です。

## ライセンス

個人サイト用として自由に編集してお使いください。
