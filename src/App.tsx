import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { GameProvider } from './contexts/GameContext';
import { TeamList } from './components/TeamList';
import { TeamForm } from './components/TeamForm';
import { GameList } from './components/GameList';
import { GameForm } from './components/GameForm';
import { GameView } from './components/GameView';
import { TeamView } from './components/TeamView';
import { APP_CONFIG } from './config';

function App() {
  return (
    <Router>
      <GameProvider>
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">Basketball Subs</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/teams">Teams</Nav.Link>
                <Nav.Link as={Link} to="/games">Games</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="mt-4">
          <Routes>
            <Route path="/" element={<GameList />} />
            <Route path="/teams" element={<TeamList />} />
            <Route path="/teams/new" element={<TeamForm />} />
            <Route path="/games" element={<GameList />} />
            <Route path="/games/new" element={<GameForm />} />
            <Route path="/games/:id" element={<GameView />} />
            <Route path="/teams/:id" element={<TeamView />} />
          </Routes>
        </Container>
      </GameProvider>
    </Router>
  );
}

export default App;
