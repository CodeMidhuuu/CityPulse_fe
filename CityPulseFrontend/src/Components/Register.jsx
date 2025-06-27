import React, { useState } from 'react';
import {
  Card,
  Form,
  Button,
  Container,
  Alert,
  InputGroup,
} from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeSlash } from 'react-bootstrap-icons';

const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone_number: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8000/register/',
        form
      );

      // Store tokens and user data
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('username', response.data.username);

      navigate('/home');
    } catch (err) {
      if (err.response?.data) {
        // Handle validation errors
        const errors = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        setError(errors);
      } else {
        setError('Registration failed. Please try again.');
      }
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
      <div className='flex-grow-1 d-flex align-items-end justify-content-center pb-5 mb-5'>
        <Card style={{ width: '25rem' }}>
          <Card.Body>
            <Card.Title className='text-center'>
              <h3 className='name'>
                <b>REGISTER</b>
              </h3>
            </Card.Title>
            {error && <Alert variant='danger'>{error}</Alert>}
            <br />
            <Form onSubmit={handleSubmit}>
              <Form.Group className='mb-3'>
                <Form.Control
                  type='text'
                  placeholder='Username'
                  required
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className='mb-3'>
                <Form.Control
                  type='email'
                  placeholder='Email'
                  required
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Form.Group>
              <Form.Group className='mb-3'>
                <Form.Control
                  type='text'
                  placeholder='Phone Number'
                  required
                  onChange={(e) =>
                    setForm({ ...form, phone_number: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className='mb-3'>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Password (min 6 characters)'
                    required
                    minLength={6}
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
                {loading ? 'Registering...' : 'Register'}
              </Button>
              <Button className='link' variant='link' href='/'>
                Already have an Account? Login
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Register;
