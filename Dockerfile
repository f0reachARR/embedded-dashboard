# Bunの公式イメージを使用
FROM oven/bun:1.3 AS base
WORKDIR /app

# 依存関係のインストール
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# ビルド用の依存関係
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# アプリケーションのビルド
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

RUN bun build --outdir dist --target bun index.ts

# 本番環境用のイメージ
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/dist .
USER bun

# ポートの公開
EXPOSE 3000

# デフォルトコマンド（上書き可能）
CMD ["bun", "run", "index.js"]