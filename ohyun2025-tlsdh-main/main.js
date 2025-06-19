// main.js
// 게시판 렌더링 및 API 연동 (순수 JS)

const API_BASE = 'http://crud.tlol.me';
const USER_ID = 'tlsdh';

// 게시글 목록 불러오기
async function fetchPosts(page = 1, size = 10) {
  const res = await fetch(`${API_BASE}/${USER_ID}/post?page=${page}&size=${size}`);
  return res.json();
}

// 게시글 상세 불러오기
async function fetchPost(id) {
  const res = await fetch(`${API_BASE}/${USER_ID}/post/${id}`);
  return res.json();
}

// 게시글 작성
async function createPost(data) {
  const res = await fetch(`${API_BASE}/${USER_ID}/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// 게시글 수정
async function updatePost(id, data) {
  const res = await fetch(`${API_BASE}/${USER_ID}/post/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// 게시글 삭제
async function deletePost(id) {
  const res = await fetch(`${API_BASE}/${USER_ID}/post/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

// 댓글 관련 함수
async function fetchComments(postId) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment?postId=${postId}`);
  return res.json();
}

async function createComment(data) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function deleteComment(id) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

// UI 렌더링 함수들 (목록, 상세, 작성, 수정 등)
// ...추후 구현 예정...

document.addEventListener('DOMContentLoaded', () => {
  // 기본적으로 게시글 목록 렌더링
  renderPostList();
});

async function renderPostList(page = 1) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="board-title"> 게시판</div><div>로딩 중...</div>`;
  const data = await fetchPosts(page);
  let html = `<div class="board-title">게시판</div>`;
  html += `<button class="button" onclick="renderPostForm()">글쓰기</button>`;
  html += `<table class="post-list">
    <tr><th>번호</th><th>제목</th><th>작성자</th><th>작성일</th></tr>`;
  (data.data || []).forEach((post, idx) => {
    html += `<tr>
      <td>${data.total - ((page-1)*data.pageSize) - idx}</td>
      <td><a href="#" onclick="renderPostDetail('${post.id}')">${post.title}</a></td>
      <td>${post.author || '-'}</td>
      <td>${post.createdAt ? new Date(post.createdAt).toLocaleString() : '-'}</td>
    </tr>`;
  });
  html += `</table>`;
  // 페이지네이션
  const totalPages = Math.ceil((data.total || 0) / (data.pageSize || 10));
  html += `<div style="margin:16px 0;">`;
  for(let i=1; i<=totalPages; i++) {
    html += `<button class="button" style="background:${i===page?'#03c75a':'#e5e5e5'};color:${i===page?'#fff':'#333'}" onclick="renderPostList(${i})">${i}</button>`;
  }
  html += `</div>`;
  app.innerHTML = html;
}

function renderPostForm() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="board-title">글쓰기</div>
    <form id="postForm">
      <input type="text" name="title" placeholder="제목" required><br>
      <input type="text" name="author" placeholder="작성자" required><br>
      <textarea name="content" placeholder="내용" rows="8" required></textarea><br>
      <button type="submit" class="button">등록</button>
      <button type="button" class="button" onclick="renderPostList()">취소</button>
    </form>
  `;
  document.getElementById('postForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      author: form.author.value,
      content: form.content.value
    };
    await createPost(data);
    renderPostList();
  };
}

function parseMedia(content) {
  // 이미지 URL 자동 변환
  content = content.replace(/(https?:\/\/(?:[^\s]+)\.(?:png|jpg|jpeg|gif|bmp))/gi, '<img src="$1" style="max-width:100%;margin:8px 0;">');
  // 동영상(mp4) URL 자동 변환
  content = content.replace(/(https?:\/\/(?:[^\s]+)\.(?:mp4|webm|ogg))/gi, '<video src="$1" controls style="max-width:100%;margin:8px 0;"></video>');
  // 줄바꿈 처리
  return content.replace(/\n/g, '<br>');
}

async function renderPostDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="board-title">게시글 상세</div><div>로딩 중...</div>';
  const post = await fetchPost(id);
  let html = `<div class="board-title">${post.title}</div>`;
  html += `<div style="color:#888; margin-bottom:8px;">작성자: ${post.author || '-'} | 작성일: ${post.createdAt ? new Date(post.createdAt).toLocaleString() : '-'}</div>`;
  html += `<div style="margin-bottom:24px;">${post.content ? parseMedia(post.content) : ''}</div>`;
  html += `<button class="button" onclick="renderPostList()">목록</button> `;
  html += `<button class="button edit" onclick="renderEditPostForm('${id}')">수정</button> `;
  html += `<button class="button delete" onclick="deletePostAndBack('${id}')">삭제</button>`;
  // 댓글 영역 추가
  html += `<div class="comment-section" id="commentSection"><div>댓글 로딩 중...</div></div>`;
  app.innerHTML = html;
  renderComments(id);
}

function renderEditPostForm(id) {
  fetchPost(id).then(post => {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="board-title">게시글 수정</div>
      <form id="editPostForm">
        <input type="text" name="title" value="${post.title || ''}" required><br>
        <input type="text" name="author" value="${post.author || ''}" required><br>
        <textarea name="content" rows="8" required>${post.content || ''}</textarea><br>
        <button type="submit" class="button edit">수정</button>
        <button type="button" class="button" onclick="renderPostDetail('${id}')">취소</button>
      </form>
    `;
    document.getElementById('editPostForm').onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      const data = {
        title: form.title.value,
        author: form.author.value,
        content: form.content.value
      };
      await updatePost(id, data);
      renderPostDetail(id);
    };
  });
}

window.deletePostAndBack = async function(id) {
  if(confirm('정말 삭제하시겠습니까?')) {
    await deletePost(id);
    renderPostList();
  }
}

async function renderComments(postId) {
  const section = document.getElementById('commentSection');
  const data = await fetchComments(postId);
  let html = `<div style="font-weight:bold;margin-bottom:8px;">댓글 (${(data.data||[]).length})</div>`;
  html += `<form id="commentForm">
    <input type="text" name="author" placeholder="작성자" required style="width:30%;display:inline-block;">
    <input type="text" name="content" placeholder="댓글 내용" required style="width:60%;display:inline-block;">
    <button type="submit" class="button" style="margin-left:8px;">등록</button>
  </form>`;
  html += `<div style="margin-top:16px;">`;
  (data.data||[]).forEach(comment => {
    html += `<div class="comment">
      <span class="meta">${comment.author || '-'} | ${comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '-'}</span><br>
      <span>${comment.content || ''}</span>
      <button class="button edit" style="float:right;" onclick="renderEditCommentForm('${comment.id}','${postId}')">수정</button>
      <button class="button delete" style="float:right;" onclick="deleteCommentAndRefresh('${comment.id}','${postId}')">삭제</button>
    </div>`;
  });
  html += `</div>`;
  section.innerHTML = html;
  document.getElementById('commentForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      postId,
      author: form.author.value,
      content: form.content.value
    };
    await createComment(data);
    renderComments(postId);
    form.reset();
  };
}

function renderEditCommentForm(commentId, postId) {
  fetch(`${API_BASE}/${USER_ID}/comment/${commentId}`)
    .then(res => res.json())
    .then(comment => {
      const section = document.getElementById('commentSection');
      let html = `<form id="editCommentForm">
        <input type="text" name="author" value="${comment.author || ''}" required style="width:30%;display:inline-block;">
        <input type="text" name="content" value="${comment.content || ''}" required style="width:60%;display:inline-block;">
        <button type="submit" class="button edit">수정</button>
        <button type="button" class="button" onclick="renderComments('${postId}')">취소</button>
      </form>`;
      section.innerHTML = html;
      document.getElementById('editCommentForm').onsubmit = async function(e) {
        e.preventDefault();
        const form = e.target;
        const data = {
          author: form.author.value,
          content: form.content.value
        };
        await fetch(`${API_BASE}/${USER_ID}/comment/${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        renderComments(postId);
      };
    });
}

// ...추가 구현 예정 (글쓰기, 상세, 수정, 삭제, 댓글 등)...
