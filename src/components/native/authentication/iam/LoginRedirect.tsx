import React from "react";
import { getCookie, setCookie } from "typescript-cookie";

type EnvDataType = Record<string, string | boolean | undefined>;

interface SessionRedirectProps {
  envInfo: EnvDataType;
  children: React.ReactNode;
}

const LoginRedirect: React.FC<SessionRedirectProps> = ({
  envInfo,
  children,
}) => {
  const sessionId = getCookie("sessionId");

  if (sessionId == null && !(window.location.hostname).includes("localhost") ) {
    setCookie("currentPKCPage", window.location.href);
    const redirectUrl = `${
      envInfo.PUBLIC_IDP_URL !== undefined ? envInfo.PUBLIC_IDP_URL : ""
    }/auth/realms/Medigy/protocol/openid-connect/auth?client_id=medigy&redirect_uri=${
      envInfo.PUBLIC_LOGIN_REDIRECT_URL !== undefined
        ? envInfo.PUBLIC_LOGIN_REDIRECT_URL
        : ""
    }login-social-pre-authorization/&state=${
      envInfo.PUBLIC_AUTH_BASE_TOKEN !== undefined
        ? envInfo.PUBLIC_AUTH_BASE_TOKEN
        : ""
    }&response_mode=fragment&response_type=code&scope=openid`;
    window.location.href = redirectUrl;
    return null;
  }

  return children;
};

export default LoginRedirect;
