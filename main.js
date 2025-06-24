// main.js
// 게시판 렌더링 및 API 연동 (순수 JS)

// 환경에 따라 API 서버 주소 자동 선택
const API_BASE =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:3000" // ← 로컬 로직서버 주소(포트는 실제 서버에 맞게)
    : "http://crud.tlol.me";
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

// 댓글 목록을 불러오는 함수 (특정 게시글의 postId로)
async function fetchComments(postId) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment?postId=${postId}`);
  return res.json();
}

// 댓글을 생성(등록)하는 함수
async function createComment(data) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// 댓글을 삭제하는 함수 (id로 삭제)
async function deleteComment(id) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

// 댓글 개수 가져오는 함수
async function fetchCommentsCount(postId) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment?postId=${postId}`);
  const data = await res.json();
  return (data.data || []).length;
}

// UI 렌더링 함수들

document.addEventListener('DOMContentLoaded', () => {
  renderPostList();
});

// 게시글 목록 렌더링 함수
async function renderPostList(page = 1) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="board-title">게시판</div><div>로딩 중...</div>`;
  const data = await fetchPosts(page);
  let html = `<div class="board-title">게시판</div>`;
  html += `<button class="button" onclick="renderPostForm()">글쓰기</button>`;
  html += `<table class="post-list">
    <tr>
      <th>번호</th>
      <th>제목</th>
      <th>작성자</th>
      <th>작성일</th>
      <th>댓글</th>
      <th>조회수</th>
    </tr>`;
  // 댓글 개수와 조회수 표시
  for (const [idx, post] of (data.data || []).entries()) {
    // 댓글 개수 비동기 처리
    html += `<tr id="post-row-${post.id}">
      <td>${data.total - ((page-1)*data.pageSize) - idx}</td>
      <td><a href="#" onclick="renderPostDetail('${post.id}')">${post.title}</a></td>
      <td>${post.author || '-'}</td>
      <td>${post.createdAt ? new Date(post.createdAt).toLocaleString() : '-'}</td>
      <td id="comment-count-${post.id}">-</td>
      <td>${post.views ?? '-'}</td>
    </tr>`;
  }
  html += `</table>`;
  // 페이지네이션
  const totalPages = Math.ceil((data.total || 0) / (data.pageSize || 10));
  html += `<div style="margin:16px 0;">`;
  for(let i=1; i<=totalPages; i++) {
    html += `<button class="button" style="background:${i===page?'#03c75a':'#e5e5e5'};color:${i===page?'#fff':'#333'}" onclick="renderPostList(${i})">${i}</button>`;
  }
  html += `</div>`;
  app.innerHTML = html;

  // 각 게시글의 댓글 개수 비동기로 표시
  for (const post of (data.data || [])) {
    fetchCommentsCount(post.id).then(count => {
      const td = document.getElementById(`comment-count-${post.id}`);
      if (td) td.textContent = count;
    });
  }
}

function renderPostForm(post = null) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="board-title">${post ? '글 수정' : '글쓰기'}</div>
    <form id="postForm">
      <input type="text" name="title" placeholder="제목" value="${post ? post.title : ''}" required><br>
      <input type="text" name="author" placeholder="작성자" value="${post ? post.author : ''}" required><br>
      <textarea name="content" placeholder="내용" rows="8" required>${post ? post.content : ''}</textarea><br>
      <button type="submit" class="button">${post ? '수정' : '등록'}</button>
      <button type="button" class="button" onclick="renderPostList()">취소</button>
    </form>
  `;
  document.getElementById('postForm').onsubmit = async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    if (post) {
      await updatePost(post.id, data);
    } else {
      await createPost(data);
    }
    renderPostList();
  };
}

async function renderPostDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="board-title">게시글</div><div>로딩 중...</div>`;
  const post = await fetchPost(id);
  let html = `<div class="board-title">게시글</div>
    <div>
      <h2>${post.title}</h2>
      <div style="color:#888;">${post.author || '-'} | ${post.createdAt ? new Date(post.createdAt).toLocaleString() : '-'}</div>
      <div style="margin:24px 0;white-space:pre-line;">${post.content || ''}</div>
      <button class="button edit" onclick="renderPostForm(${JSON.stringify(post)})">수정</button>
      <button class="button delete" onclick="handleDeletePost('${post.id}')">삭제</button>
      <button class="button" onclick="renderPostList()">목록</button>
    </div>
    <div class="comment-section" id="comment-section"></div>
  `;
  app.innerHTML = html;
  renderComments(id);
}

async function handleDeletePost(id) {
  if (confirm('정말 삭제하시겠습니까?')) {
    await deletePost(id);
    renderPostList();
  }
}

// 댓글 목록을 불러오는 함수 (특정 게시글의 postId로)
async function fetchComments(postId) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment?postId=${postId}`);
  return res.json();
}

// 댓글을 생성(등록)하는 함수
async function createComment(data) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// 댓글을 삭제하는 함수 (id로 삭제)
async function deleteComment(id) {
  const res = await fetch(`${API_BASE}/${USER_ID}/comment/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

// 게시글 상세에서 댓글 목록 및 입력 폼을 렌더링하는 함수
async function renderComments(postId) {
  const section = document.getElementById('comment-section');
  // 해당 게시글의 댓글 목록 불러오기
  const data = await fetchComments(postId);
  // 댓글 입력 폼 및 댓글 목록 HTML 생성
  let html = `<h3>댓글</h3>
    <form id="commentForm">
      <input type="text" name="author" placeholder="작성자" required>
      <input type="text" name="content" placeholder="댓글 내용" required>
      <button type="submit" class="button">등록</button>
    </form>
    <div id="comments-list">`;
  // 댓글 목록을 반복하여 출력
  (data.data || []).forEach(comment => {
    html += `<div class="comment">
      <span class="meta">${comment.author || '-'} | ${comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '-'}</span><br>
      <span>${comment.content || ''}</span>
      <button class="button delete" style="margin-left:8px;" onclick="handleDeleteComment('${comment.id}','${postId}')">삭제</button>
    </div>`;
  });
  html += `</div>`;
  section.innerHTML = html;
  // 댓글 입력 폼 제출 이벤트 등록
  document.getElementById('commentForm').onsubmit = async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    data.postId = postId; // 댓글이 어떤 게시글에 달리는지 postId 지정
    await createComment(data); // 댓글 등록
    renderComments(postId);    // 등록 후 댓글 목록 새로고침
    this.reset();              // 입력 폼 초기화
  };
}

// 댓글 삭제 버튼 클릭 시 호출되는 함수
async function handleDeleteComment(id, postId) {
  if (confirm('댓글을 삭제하시겠습니까?')) {
    await deleteComment(id);   // 댓글 삭제
    renderComments(postId);    // 삭제 후 댓글 목록 새로고침
  }
}
