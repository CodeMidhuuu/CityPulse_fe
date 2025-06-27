import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Button,
  Container,
  Alert,
  InputGroup,
} from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.username || !form.password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/login/', form);

      // Store tokens and user data consistently
      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);
      localStorage.setItem('username', res.data.username);

      navigate('/home');
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className='d-flex justify-content-center align-items-center vh-100'>
      <div className='text-center'>
        <h1>
          <b>CityPulse</b>
        </h1>
        <p>
          <i>Your one-stop solution for city updates.</i>
        </p>
      </div>
      <div className='flex-grow-1 d-flex align-items-end justify-content-center pb-5 mb-4'>
        <Card style={{ width: '25rem' }}>
          <Card.Body>
            <Card.Title className='text-center'>
              <h3 className='name'>
                <b>LOGIN</b>
              </h3>
            </Card.Title>
            {error && (
              <Alert variant='danger' className='text-center'>
                {error}
              </Alert>
            )}
            <br />
            <Form onSubmit={handleLogin}>
              <Form.Group className='mb-3'>
                <Form.Control
                  type='text'
                  placeholder='Username'
                  required
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className='mb-3'>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Password'
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                  &nbsp;
                  <Button
                    variant='outline-dark'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlash /> : <Eye />}
                  </Button>
                </InputGroup>
              </Form.Group>
              <Button
                variant='primary'
                type='submit'
                className='w-100'
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
              <Button className='link' variant='link' href='/register'>
                Don't have an Account? Register
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;
