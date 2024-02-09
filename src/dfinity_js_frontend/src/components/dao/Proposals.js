import React from "react";
import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";
import { convertTime, truncateAddress } from "../../utils";
import { LoadingButton } from "@mui/lab";
import { convertToString } from "../../utils";
import { Principal } from "@dfinity/principal";
const Proposals = ({
  proposals,
  voteProposal,
  executeProposal,
  loadingVote,
  loadingExecute,
}) => {
  const isFinished = (proposal) => {
    let now = new Date();
    let proposalEnd = new Date(Number(proposal.ends / BigInt(10 ** 6)));
    return now >= proposalEnd;
  };

  function hasVoted(proposal) {
    return proposal.userVoteStatus === 1;
  }

  const startVoteTxn = async (proposal) => {
    let proposalId = proposal.id;
    await voteProposal({ proposalId });
  };

  const startExecTxn = async (proposal) => {
    let proposalId = proposal.id;
    await executeProposal({ proposalId });
  };
  return (
    <>
      <div id="proposals" className="option">
        <p className="title">Proposals. _05</p>
      </div>
      <TableContainer
        component={Paper}
        sx={{
          background: "#02315a",
          marginBottom: "5rem",
        }}
      >
        <Table sx={{ minWidth: 650 }} size="small" aria-label="proposals">
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                ID
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Title
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Amount
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Recipient
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Votes
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Vote
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Ends on
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>

          {/* ****************Table Body*************** */}
          <TableBody>
            {proposals ? (
              proposals.map((proposal) => (
                <TableRow
                  key={proposal.appId}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell
                    align="center"
                    component="th"
                    scope="row"
                    sx={{ color: "#aec1c5" }}
                  >
                    {proposal.id}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {proposal.title}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {convertToString(proposal.amount)} ICP
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {truncateAddress(
                      Principal.from(proposal.recipient).toString()
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {proposal.votes ? convertToString(proposal.votes) : "0"}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {isFinished(proposal) ? (
                      "Vote Finished"
                    ) : hasVoted(proposal) ? (
                      "You already voted"
                    ) : (
                      <LoadingButton
                        onClick={(e) => startVoteTxn(proposal)}
                        variant="contained"
                        loading={loadingVote}
                      >
                        Vote
                      </LoadingButton>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {proposal.ends ? convertTime(proposal.ends) : "---"}
                  </TableCell>
                  <TableCell sx={{ color: "#aec1c5" }} align="center">
                    {proposal.ended ? (
                      proposal.executed ? (
                        "Successful"
                      ) : (
                        "Not Successful"
                      )
                    ) : (
                      <LoadingButton
                        onClick={(e) => startExecTxn(proposal)}
                        variant="contained"
                        disabled={!isFinished(proposal)}
                        loading={loadingExecute}
                      >
                        Execute
                      </LoadingButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <></>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

Proposals.propTypes = {
  proposals: PropTypes.instanceOf(Array).isRequired,
  voteProposal: PropTypes.func.isRequired,
  executeProposal: PropTypes.func.isRequired,
  loadingVote: PropTypes.bool.isRequired,
  loadingExecute: PropTypes.bool.isRequired,
};

export default Proposals;
