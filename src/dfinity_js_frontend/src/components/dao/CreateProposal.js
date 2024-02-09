import React from "react";
import PropTypes from "prop-types";
import { Input } from "./Form";
import { Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { Principal } from "@dfinity/principal";
import { LoadingButton } from "@mui/lab";

const Proposal = ({ createProposal, loading }) => {
  const [amountTo, setAmount] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [receiver, setRecipient] = React.useState("");

  const startTxn = async () => {
    if (amountTo === "" && title === "" && receiver === "") return;
    let amount = parseInt(amountTo, 10) * 10 ** 8;
    let recipient = Principal.fromText(receiver);
    await createProposal({ title, amount, recipient });
  };

  return (
    <div id="create-proposal" className="option">
      <p className="title">
        Create Proposal. _04
        <Tooltip title="Kickstart your new proposal" arrow>
          <Info color="primary" sx={{ cursor: "pointer" }} />
        </Tooltip>
      </p>
      <Input
        name={"Name"}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        name={"Amount In ICP"}
        type="number"
        value={amountTo}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input
        name={"Recipient"}
        type="text"
        value={receiver}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <LoadingButton
        loading={loading}
        onClick={() => startTxn()}
        variant="contained"
      >
        Create Proposal
      </LoadingButton>
    </div>
  );
};

Proposal.propTypes = {
  createProposal: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default Proposal;
