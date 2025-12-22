# embedded-dashboard

2025年度 プロジェクト実習（組み込みシステム基礎）座席表ダッシュボード

RedmineのAPIから審査待ちのチケットを取得し、該当するプロジェクトの座席をハイライト表示します。

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. 環境変数の設定

`.env.example` を参考に `.env` ファイルを作成し、Redmine APIキーを設定してください。

```bash
cp .env.example .env
```

`.env` ファイルを編集して `REDMINE_API_KEY` を設定:

```env
REDMINE_URL=https://vps2.is.kit.ac.jp/redmine
REDMINE_API_KEY=YOUR_API_KEY_HERE  # ←ここに実際のAPIキーを入力
TRACKER_ID=5  # 課題
STATUS_ID=4   # 審査待ち
```

### 3. サーバーの起動

```bash
bun --hot index.ts
```

サーバーが起動したら、ブラウザで http://localhost:3000 にアクセスしてください。

## 機能

- 6-301教室と8-312教室の座席レイアウトを表示
- Redmine APIから「課題」トラッカー、「審査待ち」ステータスのチケットを取得
- チケットがあるプロジェクトの座席を赤くハイライト表示
- 10秒ごとに自動更新
- ホットモジュールリロード（HMR）対応

## 技術スタック

- [Bun](https://bun.com) - 高速なJavaScriptランタイム
- TypeScript
- Bun.serve() - 組み込みHTTPサーバー
- HTML/CSS - フロントエンド
