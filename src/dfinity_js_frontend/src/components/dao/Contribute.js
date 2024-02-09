import React from "react";
import PropTypes from "prop-types";
import { Input } from "./Form";
import { Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";

const Contribute = ({ contributeToDAO, loading }) => {
  const [inputValue, setInputValue] = React.useState("");

  const startTxn = async () => {
    if (inputValue === "") return;
    let amount = parseInt(inputValue, 10) * 10 ** 8;
    await contributeToDAO(amount);
  };

  return (
    <div id="contribute" className="option">
      <p className="title">
        Contribute. _01
        <Tooltip title="Deposit token to join Dao and receive shares" arrow>
          <Info color="primary" sx={{ cursor: "pointer" }} />
        </Tooltip>
      </p>
      <Input
        name={"Amount In ICP"}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <LoadingButton
        loading={loading}
        onClick={() => startTxn()}
        variant="contained"
      >
        Contribute
      </LoadingButton>
    </div>
  );
};

Contribute.propTypes = {
  contributeToDAO: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};
export default Contribute;
