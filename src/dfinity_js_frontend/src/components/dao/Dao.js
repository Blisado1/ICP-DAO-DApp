import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { Container } from "@mui/system";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { NotificationSuccess, NotificationError } from "../utils/Notifications";
import Loader from "../utils/Loader";
import Header from "./Header";
import Contribute from "./Contribute";
import Redeem from "./Redeem";
import Transfer from "./Transfer";
import Proposal from "./CreateProposal";
import Proposals from "./Proposals";
import * as dao from "../../utils/dao";
import { balance as principalBalance, getDfxAddress } from "../../utils/ledger";
import { convertToString, getMessage } from "../../utils";

const Dao = ({ isAuthenticated, principal, disconnect }) => {
  const [balance, setBalance] = useState(0);
  const [daoData, setDaoData] = useState({});
  const [proposals, setProposals] = useState([]);
  const [userShares, setUserShares] = useState(0);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const [loading4, setLoading4] = useState(false);
  const [loading5, setLoading5] = useState(false);
  const [loading6, setLoading6] = useState(false);
  const getUserShares = useCallback(async () => {
    dao
      .getUserShares(principal)
      .then((shares) => {
        if (shares) {
          setUserShares(shares);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const getDaoData = useCallback(async () => {
    dao
      .getDaoData()
      .then((dao) => {
        if (dao.Ok) {
          setDaoData(dao.Ok);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const getProposals = useCallback(async () => {
    dao
      .getProposals()
      .then((proposals) => {
        if (proposals) {
          setProposals(proposals);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [address]);

  const fetchBalance = useCallback(async () => {
    if (isAuthenticated) {
      setBalance(await principalBalance());
    }
  }, [isAuthenticated]);

  const getAddress = useCallback(async () => {
    if (isAuthenticated) {
      setAddress(await getDfxAddress());
    }
  }, [isAuthenticated]);

  const contributeToDAO = async (amount) => {
    setLoading1(true);
    dao
      .makeDeposit({ amount })
      .then((resp) => {
        const msg = getMessage(resp);
        if (resp.Err) {
          throw new Error(msg);
        }
        toast(
          <NotificationSuccess
            text={`Contributed ${convertToString(amount)} ICP successfully`}
          />
        );
        fetchBalance();
        getDaoData();
        getUserShares();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text={error.message} />);
      })
      .finally((_) => {
        setLoading1(false);
      });
  };

  const redeemShares = async (amount) => {
    setLoading2(true);
    dao
      .redeemShares({ amount })
      .then((resp) => {
        const msg = getMessage(resp);
        if (resp.Err) {
          throw new Error(msg);
        }
        toast(<NotificationSuccess text={msg} />);
        fetchBalance();
        getDaoData();
        getUserShares();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text={error.message} />);
      })
      .finally((_) => {
        setLoading2(false);
      });
  };

  const transferShares = async (data) => {
    setLoading3(true);
    dao
      .transferShares(data)
      .then((resp) => {
        const msg = getMessage(resp);
        if (resp.Err) {
          throw new Error(msg);
        }
        toast(<NotificationSuccess text={msg} />);
        fetchBalance();
        getDaoData();
        getUserShares();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text={error.message} />);
      })
      .finally((_) => {
        setLoading3(false);
      });
  };

  const createProposal = async (data) => {
    setLoading4(true);
    dao
      .createProposal(data)
      .then((resp) => {
        const msg = getMessage(resp);
        if (resp.Err) {
          throw new Error(msg);
        }
        toast(<NotificationSuccess text={msg} />);
        fetchBalance();
        getProposals();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text={error.message} />);
      })
      .finally((_) => {
        setLoading4(false);
      });
  };

  const voteProposal = async (proposal) => {
    setLoading5(true);
    dao
      .voteProposal(proposal)
      .then((resp) => {
        const msg = getMessage(resp);
        if (resp.Err) {
          throw new Error(msg);
        }
        toast(<NotificationSuccess text={msg} />);
        fetchBalance();
        getProposals();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text={error.message} />);
      })
      .finally((_) => {
        setLoading5(false);
      });
  };

  const executeProposal = async (proposal) => {
    setLoading6(true);
    dao
      .executeProposal(proposal)
      .then((resp) => {
        const msg = getMessage(resp);
        if (resp.Err) {
          throw new Error(msg);
        }
        toast(<NotificationSuccess text={msg} />);
        fetchBalance();
        getDaoData();
        getProposals();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text={error.message} />);
      })
      .finally((_) => {
        setLoading6(false);
      });
  };

  const theme = createTheme({
    palette: {
      primary: {
        light: "#fcbd7a",
        main: "#f1a14b",
        dark: "#fdb261d8",
        contrastText: "#fff",
      },
    },
  });

  const fetchInitState = useCallback(async () => {
    try {
      if (address !== "") return;
      setLoading(true);
      await fetchBalance();
      await getDaoData();
      await getProposals();
      await getAddress();
      await getUserShares();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [fetchBalance, getDaoData, getProposals, getAddress, getUserShares]);

  useEffect(() => {
    if (!daoData.totalShares) {
      fetchInitState();
    }
  }, [fetchInitState, daoData]);

  if (loading) return <Loader />;

  return (
    <ThemeProvider theme={theme}>
      <div className="app">
        <Header
          address={address}
          principal={principal}
          userShares={userShares}
          balance={balance}
          disconnect={disconnect}
        />
        <Container>
          <Contribute contributeToDAO={contributeToDAO} loading={loading1} />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "flex-end",
            }}
          >
            <Redeem redeemShares={redeemShares} loading={loading2} />
          </Box>
          <Transfer transferShares={transferShares} loading={loading3} />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "flex-end",
            }}
          >
            <Proposal createProposal={createProposal} loading={loading4} />
          </Box>
          <Proposals
            proposals={proposals}
            voteProposal={voteProposal}
            executeProposal={executeProposal}
            dao={daoData}
            loadingVote={loading5}
            loadingExecute={loading6}
          />
        </Container>
      </div>
    </ThemeProvider>
  );
};
Dao.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  principal: PropTypes.string.isRequired,
  disconnect: PropTypes.func.isRequired,
};
export default Dao;
