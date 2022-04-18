import React from 'react';
import {Link} from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import logo from '../logo.png';

export default function Navigation() {
    return (
        <Navbar expand="lg" className="Lora">
        <Container>
            <Navbar.Brand as={Link} to="/" className="me-0">
                <img src={logo} className="me-2 d-inline-block align-center" style={{height: "80px"}} alt="Project logo"/>
                <span className="StreamPoolsBg">Stream Pools</span>
                <span className="ms-2 me-2">{" = "}</span>
            </Navbar.Brand>

            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link as={Link} to="/streams">Streams</Nav.Link>
                    <Nav.Link to="">&</Nav.Link>
                    <Nav.Link as={Link} to="/pools">Pools</Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Container>
        </Navbar>
    )
}