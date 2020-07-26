import axios from "axios";
import { niftronTokenLambda, niftronUserLambda } from "../constants";
import {
  Transfer,
  AcceptApproval,
  RejectApproval,
  Certificate,
} from "../models/niftronModels";
export async function addCertificate(certificate: Certificate) {
  try {
    let postBody = certificate;
    const res = await axios.post(
      niftronTokenLambda + "/tokens/certificate",
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
export async function transfer(transferModel: Transfer) {
  try {
    let postBody = transferModel;
    const res = await axios.post(niftronTokenLambda + "/transfers", postBody, {
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
    const res = await axios.get(`${niftronTokenLambda}/transfers/${id}`, {
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
      `${niftronTokenLambda}/approvals/${id}/accept`,
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
      `${niftronTokenLambda}/approvals/${id}/reject`,
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
      `${niftronTokenLambda}/users/${id}/approvals?${query}`,
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
      `${niftronTokenLambda}/transfers/${id}/sender?${query}`,
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
      `${niftronTokenLambda}/transfers/${id}/receiver?${query}`,
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
    const res = await axios.get(`${niftronUserLambda}/users/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res == null) {
      return null;
    }
    console.log(res.data.data)
    return res.data.data;
  } catch (err) {
    return null;
  }
}
