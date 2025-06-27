import React, { useState } from 'react';
import { Card, Container, Nav } from 'react-bootstrap';
import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const [historyData, setHistoryData] = useState([]);
  const [userData, setUserdata] = useState({}); // Initialize as object instead of string
  const navigate = useNavigate();
  //logout
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/');
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');

        if (!token) {
          console.error('No access token found');
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [historyRes, userRes] = await Promise.all([
          axios.get('http://localhost:8000/my-issues/', { headers }),
          axios.get('http://localhost:8000/profile/', { headers }),
        ]);

        setHistoryData(historyRes.data);
        setUserdata(userRes.data);
      } catch (error) {
        if (error.response) {
          console.error('API Error:', {
            status: error.response.status,
            data: error.response.data,
          });
        } else if (error.request) {
          console.error('Network Error:', error.request);
        } else {
          console.error('Error:', error.message);
        }
      }
    };

    fetchData();
  }, []);

  return (
    <Container className='d-flex justify-content-center align-items-center vh-100'>
      <div className='text-center'>
        <Nav style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <Nav.Link href='/home' className='link'>
            Home
          </Nav.Link>
          <Nav.Link onClick={handleLogout} className='link'>
            Logout
          </Nav.Link>
        </Nav>
        <br />
        <h1>
          <b>CityPulse</b>
        </h1>
        <p>
          <i>Your one-stop solution for city updates.</i>
        </p>
      </div>
      <div className='flex-grow-1 d-flex align-items-end justify-content-center pb-5 mb-4'>
        <Card style={{ width: '25rem' }} className='text-center'>
          <Card.Body>
            <Card.Title className='text-center'>
              <h3 className='name'>
                <b>Report History</b>
              </h3>
            </Card.Title>
            <br />
            {
              <Card.Text>
                <p>User: {userData.username}</p>

                <p>Email: {userData.email}</p>
              </Card.Text>
            }
            <br />
            <ul className='list list-unstyled'>
              {historyData.map((item) => (
                <li key={item.id} className='mb-3 p-2 border rounded shadow  '>
                  <strong className='listitem'>
                    <u>{item.subject}</u>
                  </strong>
                  <br />
                  <br />
                  <p>
                    {item.category} - {item.status}
                  </p>
                  <small>
                    <i>{new Date(item.reported_at).toLocaleString()}</i>
                  </small>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default UserProfile;
