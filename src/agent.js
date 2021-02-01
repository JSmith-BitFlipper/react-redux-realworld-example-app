import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';

const superagent = superagentPromise(_superagent, global.Promise);

const API_ROOT = 'http://localhost:8081/api';

const encode = encodeURIComponent;
const responseBody = res => res.body;

let token = null;
const tokenPlugin = req => {
  if (token) {
    req.set('authorization', `Token ${token}`);
  }
}

const requests = {
  del: (url, body) =>
    superagent.del(`${API_ROOT}${url}`, { haha: "haha" } ).use(tokenPlugin).then(responseBody),
  get: url =>
    superagent.get(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody),
  put: (url, body) =>
    superagent.put(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody),
  post: (url, body, withCookies=false) => {
    let req = superagent.post(`${API_ROOT}${url}`, body).use(tokenPlugin);
    // Pass over the cookies if requested
    if (withCookies === true) {
        req = req.withCredentials();
    }
    return req.then(responseBody);
  },
};

const Auth = {
  current: () =>
    requests.get('/user'),
  login: (username, password, assertion) =>
    requests.post('/users/login', { user: { username, password }, assertion: assertion }, true),
  register: (username, email, password) =>
    requests.post('/users', { user: { username, email, password } }),
  save: user =>
    requests.put('/user', { user })
};

const Webauthn = {
    isEnabled: (username) =>
        requests.get(`/webauthn/is_enabled/${username}`),
    beginRegister: (username) =>
        requests.post('/webauthn/begin_register', { username: username }, true),
    finishRegister: (username, assertion) =>
        requests.post('/webauthn/finish_register', { username: username, assertion: assertion }, true),
    beginLogin: (username) =>
        requests.post('/webauthn/begin_login', { username: username }, true),
    beginAttestation: (username, auth_text) =>
        requests.post('/webauthn/begin_attestation', { username: username, auth_text: auth_text }, true),
    disableWebauthn: (username, assertion) =>
        requests.post('/webauthn/disable', { username: username, assertion: assertion }, true),
}

const Tags = {
  getAll: () => requests.get('/tags')
};

const limit = (count, p) => `limit=${count}&offset=${p ? p * count : 0}`;
const omitSlug = article => Object.assign({}, article, { slug: undefined })
const Articles = {
  all: page =>
    requests.get(`/articles?${limit(10, page)}`),
  byAuthor: (author, page) =>
    requests.get(`/articles?author=${encode(author)}&${limit(5, page)}`),
  byTag: (tag, page) =>
    requests.get(`/articles?tag=${encode(tag)}&${limit(10, page)}`),
  del: slug =>
    requests.del(`/articles/${slug}`),
  favorite: slug =>
    requests.post(`/articles/${slug}/favorite`),
  favoritedBy: (author, page) =>
    requests.get(`/articles?favorited=${encode(author)}&${limit(5, page)}`),
  feed: () =>
    requests.get('/articles/feed?limit=10&offset=0'),
  get: slug =>
    requests.get(`/articles/${slug}`),
  unfavorite: slug =>
    requests.del(`/articles/${slug}/favorite`),
  update: article =>
    requests.put(`/articles/${article.slug}`, { article: omitSlug(article) }),
  create: article =>
    requests.post('/articles', { article })
};

const Comments = {
  create: (slug, comment) =>
    requests.post(`/articles/${slug}/comments`, { comment }),
  delete: (slug, commentId, username, assertion) =>
    requests.del(`/articles/${slug}/comments/${commentId}`, { username: username, assertion: assertion }),
  forArticle: slug =>
    requests.get(`/articles/${slug}/comments`)
};

const Profile = {
  follow: username =>
    requests.post(`/profiles/${username}/follow`),
  get: username =>
    requests.get(`/profiles/${username}`),
  unfollow: username =>
    requests.del(`/profiles/${username}/follow`)
};

export default {
    Articles,
    Auth,
    Comments,
    Profile,
    Tags,
    Webauthn,
    setToken: _token => { token = _token; }
};
