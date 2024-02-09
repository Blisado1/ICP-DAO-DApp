import React, { useState } from "react";
import { Typography, Box, Grid, Button } from "@mui/material";
import { Drawer } from "@mui/material";
import { Logout } from "@mui/icons-material";
import { truncateAddress } from "../../utils";
import { CgCheck, CgCopy } from "react-icons/cg";
import { convertToString } from "../../utils";
const Header = ({ address, principal, userShares, balance, disconnect }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copied2, setCopied2] = useState(false);
  return (
    <>
      <Box className="hero">
        <Box className="hero_dao">
          <Box className="logo">
            <Typography variant="string">
              Dao <span style={{ opacity: "0.5" }}>DApp.</span>
            </Typography>
          </Box>

          <Typography align="center" variant="string" className="dao_showcase">
            DAO DApp
          </Typography>

          <Box className="options">
            <Box>
              <Typography
                color={"#aec1c5"}
                fontSize="1.2rem"
                style={{
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                {" "}
                <span style={{ color: "#fcbd7a" }}>#</span> Principal:{" "}
                {truncateAddress(principal)}
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(principal);
                    setCopied2(true);
                    setTimeout(() => {
                      setCopied2(false);
                    }, 3000);
                  }}
                  style={{
                    backgroundColor: "#fcbd7a",
                    border: "0",
                    color: "white",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginLeft: "8px",
                  }}
                >
                  {copied2 ? <CgCheck className="font-[28px]" /> : <CgCopy />}
                  <span>{!copied2 ? "Copy" : "Copied!"}</span>
                </Button>
              </Typography>
              <Typography
                color={"#aec1c5"}
                fontSize="1.2rem"
                style={{ display: "flex", gap: "4px", alignItems: "center" }}
              >
                {" "}
                <span style={{ color: "#fcbd7a" }}>#</span> DFX Address:{" "}
                {truncateAddress(address)}
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    setCopied(true);
                    setTimeout(() => {
                      setCopied(false);
                    }, 3000);
                  }}
                  style={{
                    backgroundColor: "#fcbd7a",
                    border: "0",
                    color: "white",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginLeft: "8px",
                  }}
                >
                  {copied ? <CgCheck className="font-[28px]" /> : <CgCopy />}
                  <span>{!copied ? "Copy" : "Copied!"}</span>
                </Button>
              </Typography>
              <Grid container spacing={0} width="25rem" marginY={"0.5rem"}>
                <Grid item>
                  <Button href="#contribute" xs={6} className="options-nav">
                    Contribute
                  </Button>
                  <Button href="#redeem" xs={6} className="options-nav">
                    redeem shares
                  </Button>
                </Grid>
                <Grid item>
                  <Button href="#transfer" xs={6} className="options-nav">
                    transfer shares
                  </Button>
                  <Button
                    href="#create-proposal"
                    xs={6}
                    className="options-nav"
                  >
                    Create proposal
                  </Button>
                </Grid>
              </Grid>

              <Typography color={"#aec1c5"} fontSize="1rem">
                <span style={{ color: "#fcbd7a" }}>#</span> Wallet Balance:{" "}
                {balance} ICP
              </Typography>
              <Typography color={"#aec1c5"} fontSize="1rem">
                <span style={{ color: "#fcbd7a" }}>#</span> Shares:{" "}
                {convertToString(userShares)} Share(s)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <div
        className={`menu ${open && "active"}`}
        onClick={() => {
          open === false ? setOpen(true) : setOpen(false);
        }}
      >
        <Typography variant="button" color={"#fcbd7a"} mr="0.5rem">
          menu
        </Typography>
        <div>
          <div className="one">
            <div className="menu-dots"></div>
            <div className="menu-dots"></div>
          </div>
          <div className="two">
            <div className="menu-dots"></div>
            <div className="menu-dots"></div>
          </div>
        </div>
      </div>
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
      >
        <Box sx={{ display: "flex", flexDirection: "column", padding: "3rem" }}>
          <Button href="#contribute">Contribute</Button>
          <Button href="#redeem">redeem shares</Button>
          <Button href="#transfer">transfer shares</Button>
          <Button href="#create-proposal">create proposal</Button>
          <Button href="#proposals">Proposals</Button>
          <Button
            onClick={() => {
              disconnect();
            }}
            startIcon={<Logout />}
            variant={"contained"}
          >
            disconnect
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
