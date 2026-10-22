"use strict";

// ====== ユーザー設定 : ここだけ変更すれば SNS リンクを差し替えられます ======
const SITE = {
  name: "yukisiro",
  // URLを設定するとサイトにリンクが表示されます。未設定（空文字）なら非表示です。
  links: [
    { label: "GitHub", url: "https://github.com/yuk1siro", type: "github" },
    { label: "X (Twitter)", url: "https://x.com/yuk1siro", type: "x" },
    { label: "AtCoder", url: "https://atcoder.jp/users/yukisiro", type: "atcoder" }
  ]
};
// ========================================================================

const $ = (id) => document.getElementById(id);
const page = document.body.dataset.page;
const state = { posts: [], query: "", selectedTag: "All" };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
}
function safeUrl(value) {
  const url = String(value || "").trim();
  return /^https:\/\/[^\s]+$/i.test(url) ? url : "";
}
function formatDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  return match ? `${match[1]}.${match[2]}.${match[3]}` : String(date || "");
}
function postUrl(slug) { return `./article.html?post=${encodeURIComponent(slug)}`; }

function initCommon() {
  document.querySelectorAll("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });
  const links = SITE.links.filter(item => safeUrl(item.url));
  const render = (item) => `<a href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(item.label)}</span><span aria-hidden="true">↗</span></a>`;
  if ($("socialLinks")) $("socialLinks").innerHTML = links.map(render).join("");
  if ($("aboutSocialLinks")) $("aboutSocialLinks").innerHTML = links.map(render).join("");
}
function articleCard(post) {
  return `<a class="article-item" href="${postUrl(post.slug)}">
    <div class="article-item-top"><time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time><span class="article-arrow" aria-hidden="true">↗</span></div>
    <h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.description)}</p>
    <div class="article-tags">${post.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
  </a>`;
}
async function fetchPosts() {
  const response = await fetch("./posts/index.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`記事一覧の取得に失敗: HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("index.json は配列にしてください");
  return data.filter(post => post && /^[a-z0-9-]+$/.test(post.slug) && typeof post.title === "string" && typeof post.date === "string" && typeof post.description === "string" && Array.isArray(post.tags) && post.tags.every(tag => typeof tag === "string")).sort((a,b) => b.date.localeCompare(a.date));
}
function renderRecent() {
  const target = $("recentList");
  if (!target) return;
  target.innerHTML = state.posts.length ? state.posts.slice(0, 3).map(articleCard).join("") : '<p class="empty-message">まだ記事がありません。</p>';
}
function renderTags() {
  const target = $("tagFilters");
  if (!target) return;
  const tags = ["All", ...new Set(state.posts.flatMap(post => post.tags))];
  target.innerHTML = tags.map(tag => `<button type="button" class="tag-button ${state.selectedTag === tag ? "selected" : ""}" data-tag="${escapeHtml(tag)}" aria-pressed="${state.selectedTag === tag}">${escapeHtml(tag)}</button>`).join("");
  target.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    state.selectedTag = button.dataset.tag;
    renderTags(); renderArticles();
  }));
}
function renderArticles() {
  const target = $("articleList");
  if (!target) return;
  const q = state.query.trim().toLocaleLowerCase();
  const result = state.posts.filter(post => (state.selectedTag === "All" || post.tags.includes(state.selectedTag)) && [post.title, post.description, ...post.tags].join(" ").toLocaleLowerCase().includes(q));
  target.innerHTML = result.length ? result.map(articleCard).join("") : '<p class="empty-message">該当する記事はありません。</p>';
  if ($("resultCount")) $("resultCount").textContent = `${result.length} article${result.length === 1 ? "" : "s"}`;
}

// HTMLをエスケープしてから、よく使うMarkdown記法だけを表示します。
// スクリプトやHTMLの埋め込みは実行しません。
function inlineMarkdown(value) {
  const tokens = [];
  let s = escapeHtml(value).replace(/`([^`]+)`/g, (_, code) => {
    const key = `@@INLINECODE${tokens.length}@@`;
    tokens.push(`<code>${code}</code>`);
    return key;
  });
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, text, url) => `<a href="${escapeHtml(url.replace(/&amp;/g,"&"))}" target="_blank" rel="noopener noreferrer">${text}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return s.replace(/@@INLINECODE(\d+)@@/g, (_, index) => tokens[Number(index)]);
}
function markdownToHtml(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const result = [];
  let paragraph = [], list = [], listType = null, quotes = [];
  function flushP() { if (paragraph.length) { result.push(`<p>${paragraph.map(inlineMarkdown).join(" ")}</p>`); paragraph=[]; } }
  function flushL() { if (list.length) { result.push(`<${listType}>${list.map(line=>`<li>${inlineMarkdown(line)}</li>`).join("")}</${listType}>`); list=[]; listType=null; } }
  function flushQ() { if (quotes.length) { result.push(`<blockquote><p>${quotes.map(inlineMarkdown).join(" ")}</p></blockquote>`); quotes=[]; } }
  function flush() { flushP(); flushL(); flushQ(); }
  for (let i=0; i<lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      flush(); const language = line.replace(/^\s*```/, "").trim(); const code=[];
      while (++i<lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i]);
      result.push(`<pre><code${language ? ` data-language="${escapeHtml(language)}"` : ""}>${escapeHtml(code.join("\n"))}</code></pre>`);
    } else if (!line.trim()) flush();
    else if (/^#{1,4}\s+/.test(line)) { flush(); const level=line.match(/^#+/)[0].length; result.push(`<h${level}>${inlineMarkdown(line.slice(level).trim())}</h${level}>`); }
    else if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { flush(); result.push("<hr>"); }
    else if (/^>\s?/.test(line)) { flushP(); flushL(); quotes.push(line.replace(/^>\s?/, "")); }
    else if (/^\s*[-*+]\s+/.test(line)) { flushP(); flushQ(); if (listType && listType!=="ul") flushL(); listType="ul"; list.push(line.replace(/^\s*[-*+]\s+/, "")); }
    else if (/^\s*\d+\.\s+/.test(line)) { flushP(); flushQ(); if (listType && listType!=="ol") flushL(); listType="ol"; list.push(line.replace(/^\s*\d+\.\s+/, "")); }
    else { flushL(); flushQ(); paragraph.push(line.trim()); }
  }
  flush(); return result.join("\n");
}
async function renderPost() {
  const target = $("postContainer");
  const slug = new URLSearchParams(location.search).get("post");
  const post = state.posts.find(item => item.slug === slug);
  if (!post) { target.innerHTML = '<div class="error-message">記事が見つかりません。<a href="./articles.html">一覧に戻る →</a></div>'; return; }
  document.title = `${post.title} | ${SITE.name}`;
  try {
    const response = await fetch(`./posts/${encodeURIComponent(post.slug)}.md`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const source = await response.text();
    target.innerHTML = `<header class="post-header"><p class="section-kicker">ARTICLE / ${escapeHtml(formatDate(post.date))}</p><h1>${escapeHtml(post.title)}</h1><p class="post-lead">${escapeHtml(post.description)}</p><div class="article-tags">${post.tags.map(tag=>`<span>${escapeHtml(tag)}</span>`).join("")}</div></header><div class="markdown-body">${markdownToHtml(source)}</div>`;
  } catch(error) {
    console.error(error);
    target.innerHTML = '<div class="error-message">記事本文を読み込めませんでした。</div>';
  }
}
async function main() {
  initCommon();
  if (page !== "home" && page !== "articles" && page !== "article") return;
  if ($("searchInput")) $("searchInput").addEventListener("input", event => { state.query = event.target.value; renderArticles(); });
  try {
    state.posts = await fetchPosts();
    if (page === "home") renderRecent();
    if (page === "articles") { renderTags(); renderArticles(); }
    if (page === "article") await renderPost();
  } catch(error) {
    console.error(error);
    const target = page === "home" ? $("recentList") : page === "articles" ? $("articleList") : $("postContainer");
    if (target) target.innerHTML = '<div class="error-message">記事を読み込めませんでした。ローカルで確認する場合は README の手順に従ってサーバーを起動してください。</div>';
  }
}
main();
