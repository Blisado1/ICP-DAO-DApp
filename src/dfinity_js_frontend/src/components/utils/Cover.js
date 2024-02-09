import React from "react";
import PropTypes from "prop-types";
import { Button } from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";

const Cover = ({ title, login, coverImg }) => {
  if ((title, login, coverImg)) {
    return (
      <div
        className="cover-page"
        style={{ background: "#000", minHeight: "100vh" }}
      >
        <div>
          <img src={coverImg} alt="dao" />
        </div>
        <div className="loginBox">
          <div>
            <h1 style={{ margin: "1rem", color: "white" }}>{title}</h1>
            <p style={{ margin: "0.5rem", color: "white" }}>
              Please connect your wallet to continue.
            </p>
            <Button
              onClick={login}
              variant="outlined"
              color="primary"
              startIcon={<AccountBalanceWallet />}
            >
              Connect Wallet
            </Button>
          </div>
          <p style={{ color: "white" }}>Powered by Internet Computer</p>
        </div>
      </div>
    );
  }
  return null;
};

Cover.propTypes = {
  title: PropTypes.string,
};

Cover.defaultProps = {
  title: "",
};

export default Cover;
