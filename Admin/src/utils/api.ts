// export const API_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}4000` : "http://localhost4000";
export const API_URL = process.env.NODE_ENV === "production" ? "https://api.mfolks.com" : "http://localhost:4000";

export const getAuthToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("adminToken");
    }
    return null;
};

export const setAuthToken = (token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("adminToken", token);
    }
};

export const clearAuthToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken");
    }
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const token = getAuthToken();

    const isFormData = options.body instanceof FormData;
    const headers: any = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    // Ensure cookies (like refreshToken) are sent cross-origin if needed
    options.credentials = "include";

    let response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // If token is invalid or expired, backend seems to return 401, or in your case 500 with a specific message
    const isTokenExpired = response.status === 401 || (response.status === 500 && !response.ok);

    if (!response.ok) {
        let errorData: any = {};
        try {
            errorData = await response.json();
        } catch {
            // Ignored
        }

        if (isTokenExpired && errorData?.message?.toLowerCase().includes("token")) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    // Attempt to refresh the token using the refresh cookie
                    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                    });

                    const refreshData = await refreshRes.json();
                    if (refreshData.success && refreshData.data?.refreshToken) {
                        // Note: Our backend returns `refreshToken` but also seems to return `data: result`. Let's assume it returns `accessToken` too?
                        // Actually `auth.controller.ts` for refreshToken returns `data: result` where result is { accessToken, refreshToken }
                        const newAccessToken = refreshData.data?.accessToken || refreshData.data?.refreshToken;
                        if (newAccessToken) {
                            setAuthToken(newAccessToken);
                            onRefreshed(newAccessToken);
                            isRefreshing = false;
                            // Retry the original request
                            headers.Authorization = `Bearer ${newAccessToken}`;
                            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                                ...options,
                                headers,
                            });
                            if (!retryResponse.ok) {
                                const retryError = await retryResponse.json();
                                throw { status: retryResponse.status, data: retryError };
                            }
                            return retryResponse.json();
                        }
                    }
                    // If refresh fails, clear token
                    clearAuthToken();
                    if (typeof window !== "undefined") window.location.href = "/login";
                } catch (e) {
                    clearAuthToken();
                    if (typeof window !== "undefined") window.location.href = "/login";
                } finally {
                    isRefreshing = false;
                }
            } else {
                // Wait for the token to refresh and then retry
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh(async (newToken: string) => {
                        headers.Authorization = `Bearer ${newToken}`;
                        try {
                            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                                ...options,
                                headers,
                            });
                            if (!retryResponse.ok) {
                                const retryError = await retryResponse.json();
                                reject({ status: retryResponse.status, data: retryError });
                            } else {
                                resolve(await retryResponse.json());
                            }
                        } catch (err) {
                            reject(err);
                        }
                    });
                });
            }
        }

        throw { status: response.status, data: errorData };
    }

    return response.json();
};
