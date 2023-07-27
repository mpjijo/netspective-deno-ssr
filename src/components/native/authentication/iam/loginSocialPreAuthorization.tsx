import React, { useState } from "react";
// import Cookies from "js-cookie";
import { getCookie, setCookie } from "typescript-cookie";
type EnvDataType = Record<string, string | boolean | undefined>;

interface LoginProps {
  envInfo: EnvDataType;
}

interface ResultData {
  data: {
    medigyIamSsoEstablishSession: MedigyIamSsoEstablishSession;
  };
}

interface MedigyIamSsoEstablishSession {
  establishSessionResult: EstablishSessionResult;
}

interface EstablishSessionResult {
  status: string;
  error: string;
  message: string;
  data: EstablishSessionResultData;
}

interface EstablishSessionResultData {
  jwToken: string;
  accessToken: string;
  refreshToken: string;
  userProfile: UserProfile;
  membership: Membership;
}

interface UserProfile {
  personId: number;
  firstName: string;
  lastName: string;
  adminCheck: boolean;
  email: string;
}

interface Membership {
  length: number;
  [key: number]: {
    id: number;
    displayName: string;
  };
}

const LoginSocialPreAuthorization: React.FC<LoginProps> = ({ envInfo }) => {
  const [successCheck, setSuccess] = useState(false);
  const [failCheck, setFailCheck] = useState(false);
  function getUrlVars(): Record<string, string | null> {
    const vars: Record<string, string | null> = {};
    let hash: string[] | undefined;
    const hashes: string[] | undefined | string = window.location.href
      .slice(window.location.href.indexOf("?") + 1)
      .split("&");
    for (let i = 0; i < hashes.length; i++) {
      hash = hashes[i]?.split("=") ?? [];
      if (hash[0] != null) vars[hash[0]] = hash[1] ?? null;
    }

    return vars;
  }

  const code: string | null | undefined = getUrlVars()["code"];
  const bzoUrl = envInfo.PUBLIC_LOGIN_REDIRECT_URL;
  let internalUser = "false";
  if (getCookie("observability-assurance-engineering") != null) {
    internalUser = "true";
  }

  const gtmTagName = "Sign In"; //envInfo.PUBLIC_SIGN_IN_GTM_TAG_NAME as string;
  const aecId = envInfo.PUBLIC_SIGN_IN_AEC_ID as string;
  const ot_tags = `{"gtmTagName" : "${gtmTagName}","aecId":"${aecId}", "internalUser":${internalUser}}`;
  let ot_ctx : string | null | undefined = JSON.stringify(getCookie("otContext"));
  if (ot_ctx == undefined) ot_ctx = null;
  let finger: string | null | undefined = JSON.stringify(getCookie("finger"));
  if (finger == undefined) finger = null;
  if (code != "" && code != undefined) {
    const authenticateWithRealmAccessQuery = `mutation{
  		medigyIamSsoEstablishSession(input:{

  		  establishSessionInput:{

  		    accessCode: "${code}"
  		    redirectUrl: "${bzoUrl as string}login-social-pre-authorization/"
  		  }
  		  fingerPrint: ${finger}
  		  otContext: ${ot_ctx}
  		  otTags: ${JSON.stringify(ot_tags)}

  		}){
  		  establishSessionResult{
  		    status
  		    error
  		    message
  		    data{
  		      jwToken
  		      accessToken
  		      refreshToken
  		      userProfile{
  			personId
  			firstName
  			lastName
  			adminCheck
  			email
  		      }
  		      membership{
  			id
  			displayName
  		      }
  		    }
  		  }
  		}
  	      }`;
    const idpUrl = envInfo.PUBLIC_POST_GRAPHQL_API_URL;

    if (typeof idpUrl === "string") {
      const url = new URL(idpUrl);
      void fetch(url, {
        method: "POST",
        body: JSON.stringify({ query: authenticateWithRealmAccessQuery }),
        headers: {
          "Content-Type": "application/json",
          "cache-control": "no-cache",
        },
      })
        .then((response) => response.json())
        .then((resultData: ResultData) => {
          console.log(Object.keys(resultData));
          const userSession =
            resultData.data.medigyIamSsoEstablishSession?.establishSessionResult
              ?.data.userProfile;
          const sessionId =
            resultData.data.medigyIamSsoEstablishSession.establishSessionResult
              .data.accessToken;

          if (
            userSession != null &&
            resultData.data.medigyIamSsoEstablishSession.establishSessionResult
              .status == "Success"
          ) {
            if (sessionId != null && sessionId != "") {
              setSuccess(true);
            }
            const profileImage = ""; //userSession.profileImageUrl;
            let tenantId: number | string = "";
            let status = 0; // Checking for default teanant details...
            const firstname = userSession.firstName;
            const lastname = userSession.lastName;
            const personid = userSession.personId.toString();
            const username = userSession.email;
            const memberOrganizationDetails =
              resultData.data.medigyIamSsoEstablishSession
                .establishSessionResult.data.membership;
            const memberOrganization =
              resultData.data.medigyIamSsoEstablishSession
                .establishSessionResult.data.membership;

            for (let i = 0; i < memberOrganizationDetails.length; i++) {
              if (memberOrganizationDetails[i]?.id == 42) {
                tenantId = memberOrganizationDetails[i]?.id.toString() ?? "";
                status = 1;
                break;
              }
            }
            // Set for fist tenant details ad default teanant if there is no default tenant Id...
            if (status == 0 && memberOrganizationDetails.length > 0) {
              tenantId = memberOrganizationDetails[0]?.id.toString() ?? "";
            }

            const tenantArray: string[] = [];
            for (let i = 0; i < memberOrganization.length; i++) {
              tenantArray[i] = memberOrganization[i]?.id.toString() ?? "";
            }
            localStorage.setItem("firstname", firstname);
            localStorage.setItem(
              "medigyApiAccessToken",
              resultData.data.medigyIamSsoEstablishSession
                .establishSessionResult.data.jwToken,
            );
            const fullName = firstname + lastname;
            const nameArray = fullName.split(" ");
            let modifiedSecondname;
            if (typeof nameArray[1] !== "undefined" && nameArray[1] !== null) {
              modifiedSecondname = nameArray[1].charAt(0) + ".";
            } else {
              modifiedSecondname = "";
            }
            setCookie("fullName", nameArray[0] + " " + modifiedSecondname);
            setCookie("tenantArray", JSON.stringify(tenantArray));
            localStorage.setItem("tenantArray", JSON.stringify(tenantArray));
            setCookie("profileImage", profileImage);
            setCookie("firstname", firstname);
            setCookie("lastname", lastname);
            setCookie("personid", personid);
            setCookie("userEmail", username);
            setCookie("tenantId", tenantId);
            setCookie("cookie-agree", "true");
            setCookie("ilmLoginCheck", "true");
            setCookie("isAdmin", userSession.adminCheck.toString());
            setCookie(
              "medigyApiAccessToken",
              resultData.data.medigyIamSsoEstablishSession
                .establishSessionResult.data.jwToken,
            );
            setCookie(
              "refreshToken",
              resultData.data.medigyIamSsoEstablishSession
                .establishSessionResult.data.refreshToken,
            );
            const otCtx = {
              fingerPrint: getCookie("finger"),
              userEmail: getCookie("userEmail"),
            };
            setCookie("otCtx", JSON.stringify(otCtx));

            if (sessionId != null && sessionId != "") {
              setCookie("sessionId", sessionId);
              let reDirectPageUrl: string | null | boolean | undefined =
                getCookie("currentPKCPage");
              if (
                reDirectPageUrl == "" ||
                reDirectPageUrl == undefined ||
                reDirectPageUrl == null
              ) {
                reDirectPageUrl = bzoUrl;
              }
              window.location.href = reDirectPageUrl as string;
            }
          } else {
            setFailCheck(true);
          }
        });
    }
  }
  // Converting to JSON

  return (
    <React.Fragment>
      {" "}
      { (!successCheck && !failCheck )?(
              <div id="jwtValue" style={{}}>
                <div className="text-center">

              {" "}
              Please wait.
              <div role="status">
                <svg aria-hidden="true" className="inline w-10 h-10 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="sr-only">Loading...</span>
              </div>

              </div>

            </div>
      
      ): undefined

      }
      {successCheck ? (
        <div id="jwtValue" style={{}}>
          <div className="text-center">
          {" "}
          Successfully Logged In
          </div>
        </div>
      ) : undefined}
      {failCheck ? (
        <div id="jwtValue" style={{}}>
          <div className="text-center">
          {" "}
          Logged In Failed
          </div>
        </div>
      ) : undefined}
    </React.Fragment>
  );
};

export default LoginSocialPreAuthorization;
