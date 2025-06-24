// main.js
// 게시판 렌더링 및 API 연동 (순수 JS)

// API 주소와 사용자 ID를 상수로 지정
const API_BASE = "http://crud.tlol.me"; // 또는 "http://localhost:3000" 등 원하는 주소로 변경
const USER_ID = 'tlsdh';

// 게시글 목록 불러오기 함수
async function fetchPosts(page = 1, size = 10) {
  // 지정한 API 서버에서 게시글 목록을 가져옴
  const res = await fetch(`${API_BASE}/${USER_ID}/post?page=${page}&size=${size}`);
  return res.json();
}

// 게시글 상세 불러오기 함수
async function fetchPost(id) {
  // 지정한 API 서버에서 특정 게시글의 상세 정보를 가져옴
  const res = await fetch(`${API_BASE}/${USER_ID}/post/${id}`);
  return res.json();
}

// 게시글 작성 함수
async function createPost(data) {
  // 지정한 API 서버에 새 게시글을 등록함
  const res = await fetch(`${API_BASE}/${USER_ID}/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// 게시글 수정 함수
async function updatePost(id, data) {
  // 지정한 API 서버에서 특정 게시글을 수정함
  const res = await fetch(`${API_BASE}/${USER_ID}/post/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// 게시글 삭제 함수
async function deletePost(id) {
  // 지정한 API 서버에서 특정 게시글을 삭제함
  const res = await fetch(`${API_BASE}/${USER_ID}/post/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

// 페이지가 로드되면 게시글 목록을 렌더링
document.addEventListener('DOMContentLoaded', () => {
  renderPostList();
});

// 게시글 목록 렌더링 함수
async function renderPostList(page = 1) {
  const app = document.getElementById('app');
  // 로딩 메시지 표시
  app.innerHTML = `<div class="board-title">게시판</div><div>로딩 중...</div>`;
  // 게시글 목록 데이터 불러오기
  const data = await fetchPosts(page);
  let html = `<div class="board-title">게시판</div>`;
  html += `<button class="button" onclick="renderPostForm()">글쓰기</button>`;
  html += `<table class="post-list">
    <tr>
      <th>번호</th>
      <th>제목</th>
      <th>작성자</th>
    </tr>`;
  // 게시글 목록을 테이블로 출력
  for (const [idx, post] of (data.data || []).entries()) {
    html += `<tr id="post-row-${post.id}">
      <td>${data.total - ((page-1)*data.pageSize) - idx}</td>
      <td><a href="#" onclick="renderPostDetail('${post.id}')">${post.title}</a></td>
      <td>${post.author || '-'};</td>
    </tr>`;
  }
  html += `</table>`;
  // 페이지네이션 버튼 생성
  const totalPages = Math.ceil((data.total || 0) / (data.pageSize || 10));
  html += `<div style="margin:16px 0;">`;
  for(let i=1; i<=totalPages; i++) {
    html += `<button class="button" style="background:${i===page?'#03c75a':'#e5e5e5'};color:${i===page?'#fff':'#333'}" onclick="renderPostList(${i})">${i}</button>`;
  }
  html += `</div>`;
  app.innerHTML = html;
}

// 게시글 작성/수정 폼 렌더링 함수
function renderPostForm(post = null) {
  const app = document.getElementById('app');
  // 폼 UI 생성 (수정이면 기존 값, 아니면 빈 값)
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
  // 폼 제출 이벤트 등록
  document.getElementById('postForm').onsubmit = async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    if (post) {
      // 수정일 때
      await updatePost(post.id, data);
    } else {
      // 새 글 등록일 때
      await createPost(data);
    }
    renderPostList();
  };
}

// 게시글 상세 페이지 렌더링 함수
async function renderPostDetail(id) {
  const app = document.getElementById('app');
  // 로딩 메시지 표시
  app.innerHTML = `<div class="board-title">게시글</div><div>로딩 중...</div>`;
  // 게시글 데이터 불러오기
  const post = await fetchPost(id);
  // 게시글 상세 UI 생성
  let html = `<div class="board-title">게시글</div>
    <div>
      <h2>${post.title}</h2>
      <div style="color:#888;">${post.author || '-'} | ${post.createdAt ? new Date(post.createdAt).toLocaleString() : '-'}</div>
      <div style="margin:24px 0;white-space:pre-line;">${post.content || ''}</div>
      <button class="button edit" onclick="editPost('${post.id}')">수정</button>
      <button class="button delete" onclick="handleDeletePost('${post.id}')">삭제</button>
      <button class="button" onclick="renderPostList()">목록</button>
    </div>`;
  app.innerHTML = html;
}

// 게시글 삭제 처리 함수
async function handleDeletePost(id) {
  if (confirm('정말 삭제하시겠습니까?')) {
    await deletePost(id);
    renderPostList();
  }
}

// 아래 함수 추가
async function editPost(id) {
  const post = await fetchPost(id);
  renderPostForm(post);
}

