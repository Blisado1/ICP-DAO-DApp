import React from "react";
import PropTypes from "prop-types";
import { Input } from "./Form";
import { Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
const Redeem = ({ redeemShares, loading }) => {
  const [inputValue, setInputValue] = React.useState("");

  const startTxn = async () => {
    if (inputValue === "") return;
    let amount = parseInt(inputValue, 10) * 10 ** 8;
    await redeemShares(amount);
  };

  return (
    <div id="redeem" className="option">
      <p className="title">
        Redeem Shares. _02
        <Tooltip title="Convert shares back to token" arrow>
          <Info color="primary" sx={{ cursor: "pointer" }} />
        </Tooltip>
      </p>
      <Input
        name={"Amount of Shares"}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <LoadingButton
        loading={loading}
        onClick={() => startTxn()}
        variant="contained"
      >
        Redeem
      </LoadingButton>
    </div>
  );
};

Redeem.propTypes = {
  redeemShares: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default Redeem;
