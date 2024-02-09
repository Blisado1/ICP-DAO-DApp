import React from "react";
import { Spinner } from "react-bootstrap";

const Loader = () => (
  <div className="d-flex justify-content-center h-[100vh]">
    <Spinner
      animation="border"
      role="status"
      className="opacity-25"
      style={{ marginTop: "50%" }}
    >
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  </div>
);
export default Loader;
