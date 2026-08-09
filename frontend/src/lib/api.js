// import axios from "axios";

// const api = axios.create({ baseURL: "/api" });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("habitly_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem("habitly_token");
//       localStorage.removeItem("habitly_user");
//       if (!window.location.pathname.startsWith("/welcome")) {
//         window.location.href = "/welcome";
//       }
//     }
//     return Promise.reject(err);
//   }
// );

// export default api;


import axios from "axios";

const api = axios.create({
  baseURL: "https://habitly-v2.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("habitly_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("habitly_token");
      localStorage.removeItem("habitly_user");

      if (!window.location.pathname.startsWith("/welcome")) {
        window.location.href = "/welcome";
      }
    }

    return Promise.reject(err);
  }
);

export default api;