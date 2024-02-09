import React from "react";
import { Container } from "react-bootstrap";
import Dao from "./components/dao/Dao";
import "./App.css";
import coverImg from "./assets/img/DAO.jpg";
import { login, logout as destroy } from "./utils/auth";
import Cover from "./components/utils/Cover";
import { Notification } from "./components/utils/Notifications";

const App = function AppWrapper() {
  const isAuthenticated = window.auth.isAuthenticated;
  const principal = window.auth.principalText;

  return (
    <>
      <Notification />
      {isAuthenticated ? (
        <Container fluid="md">
          <main>
            <Dao
              isAuthenticated={isAuthenticated}
              principal={principal}
              disconnect={destroy}
            />
          </main>
        </Container>
      ) : (
        <Cover title="ICP DAO DApp" login={login} coverImg={coverImg} />
      )}
    </>
  );
};

export default App;
