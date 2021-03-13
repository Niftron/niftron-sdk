import axios from "axios";
import { NiftronAPI, NiftronUserLambda } from "../constants";
import {
  Transfer,
  AcceptApproval,
  RejectApproval,
  Certificate,
  Badge,
  GiftCard,
  TokenId,
  Pledge,
  Token,
} from "../models/niftronModels";
/**
 * @param {Token} token Token.
 * @return {number|null} 
 */
export async function addToken(token: Token) {
  try {
    let postBody = token;
    const res = await axios.post(
      NiftronAPI + "/tokens/mint/token",
      postBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (res == null) {
      return null;
    }
    return res;
  } catch (err) {
    return null;
  }
}
/**
 * @param {Pledge} pledgeModel Pledge.
 * @return {number|null} 
 */
export async function pledge(pledgeModel: Pledge) {
  try {
    let postBody: Pledge = pledgeModel;
    const res = await axios.post(NiftronUserLambda + "/users/pledge", postBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
/**
 * @param {Certificate} certificate Certificate.
 * @return {number|null} 
 */
export async function addCertificate(certificate: Certificate) {
  try {
    let postBody = certificate;
    const res = await axios.post(
      NiftronAPI + "/tokens/mint/certificate",
      postBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
/**
 * @param {Badge} badge Badge.
 * @return {number|null} 
 */
export async function addBadge(badge: Badge) {
  try {
    let postBody = badge;
    const res = await axios.post(
      NiftronAPI + "/tokens/mint/badge",
      postBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
/**
 * @param {GiftCard} giftCard GiftCard.
 * @return {number|null} 
 */
export async function addGiftCard(giftCard: GiftCard) {
  try {

    let postBody = giftCard;
    const res = await axios.post(
      NiftronAPI + "/tokens/mint/giftcard",
      postBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
/**
 * @param {Transfer} transferModel Transfer.
 * @return {number|null} 
 */
export async function transfer(transferModel: Transfer) {
  try {
    let postBody = transferModel;
    const res = await axios.post(NiftronAPI + "/transactions/transfers", postBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
/**
 * @param {Transfer} transferModel Transfer.
 * @return {number|null} 
 */
export async function expressTransfer(transferModel: Transfer) {
  try {
    let postBody = transferModel;
    console.log(postBody)
    const res = await axios.post(NiftronAPI + "/transactions/expressTransfer", postBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    console.log(err);
    return null;
  }
}
/**
 * @param {Array<TokenId>} idList  Array<TokenId>.
 */
export async function getTokenByIdList(idList: Array<TokenId>) {
  try {
    const res = await axios.post(`${NiftronAPI}/tokens/getData`, idList, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (res === null) {
      return null
    }
    return res.data;
  } catch (err) {
    return null;
  }
}
/**
 * @param {string} id  string.
 */
export async function getTokenById(id: string) {
  try {
    const res = await axios.get(`${NiftronAPI}/tokens/${id}`, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (res === null) {
      return null
    }
    return res.data;
  } catch (err) {
    return null;
  }
}

export async function trust(trustModel: any) {
  try {
    let postBody = trustModel;
    const res = await axios.post(NiftronAPI + "/tokens/trust", postBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
export async function submitTransfer(transferModel: Transfer) {
  try {
    let postBody = transferModel;
    const res = await axios.post(NiftronAPI + "/transactions/transfers/submit", postBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
export async function getTransferById(id: string) {
  try {
    const res = await axios.get(`${NiftronAPI}/transactions/transfers/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res == null) {
      return null;
    }
    return res.data;
  } catch (err) {
    return null;
  }
}
export async function acceptApprovals(id: string, approval: AcceptApproval) {
  try {
    let postBody: AcceptApproval = approval;
    const res = await axios.post(
      `${NiftronAPI}/transactions/approvals/${id}/accept`,
      postBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
export async function rejectApprovals(id: string, reject: RejectApproval) {
  try {
    let postBody: RejectApproval = reject;

    const res = await axios.post(
      `${NiftronAPI}/transactions/approvals/${id}/reject`,
      postBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
export async function getApprovalsByUser(
  id: string,
  limit: number,
  page: number
) {
  try {
    let query = "";
    if (limit > 0 && page > 0) {
      query += `limit=${limit}&page=${page}`;
    }
    const res = await axios.get(
      `${NiftronAPI}/transactions/users/${id}/approvals?${query}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res == null) {
      return null;
    }
    return res.data;
  } catch (err) {
    return null;
  }
}
export async function getTransfersBySender(
  id: string,
  limit: number,
  page: number
) {
  try {
    let query = "";
    if (limit > 0 && page > 0) {
      query += `limit=${limit}&page=${page}`;
    }
    const res = await axios.get(
      `${NiftronAPI}/transactions/transfers/${id}/sender?${query}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res == null) {
      return null;
    }
    return res.data;
  } catch (err) {
    return null;
  }
}
export async function getTransfersByReceiver(
  id: string,
  limit: number,
  page: number
) {
  try {
    let query = "";
    if (limit > 0 && page > 0) {
      query += `limit=${limit}&page=${page}`;
    }
    const res = await axios.get(
      `${NiftronAPI}/transactions/transfers/${id}/receiver?${query}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res == null) {
      return null;
    }
    return res.data;
  } catch (err) {
    return null;
  }
}
export async function getAccountById(id: string) {
  try {
    const res = await axios.get(`${NiftronAPI}/users/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res == null) {
      return null;
    }
    return res.data.data;
  } catch (err) {
    return null;
  }
}

export async function getProjectByPublicKey(publicKey: string) {
  try {
    const res = await axios.get(`${NiftronAPI}/projects/${publicKey}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res != null) {
      if (res.status === 200) {
        return res.data.data;
      } else {
        return res.data.data;
      }
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

export async function activate(
  userPublicKey: string,
  merchantPublicKey: string,
  xdr: string
) {
  try {
    let postBody = {
      userPublicKey,
      merchantPublicKey,
      xdr
    };
    const res = await axios.post(
      NiftronAPI + "/users/activate",
      postBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}
export async function goLive(
  userPublicKey: string,
  merchantPublicKey: string,
  xdr: string
) {
  try {
    let postBody = {
      userPublicKey,
      merchantPublicKey,
      xdr
    };
    const res = await axios.post(
      NiftronAPI + "/users/goLive",
      postBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (res == null) {
      return null;
    }
    return res.status;
  } catch (err) {
    return null;
  }
}


