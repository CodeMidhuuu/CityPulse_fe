import React, { useState, useEffect } from 'react';
import '../index.css';
import {
  Card,
  Container,
  Form,
  Button,
  Badge,
  Alert,
  Nav,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const Home = () => {
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    customCategory: '',
    description: '',
    location: '',
    latitude: null,
    longitude: null,
    media: null,
  });

  const [showMap, setShowMap] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Default map center
  const [success, setSuccess] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const navigate = useNavigate();
  //logout
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/');
  };

  // Geocode location
  useEffect(() => {
    let isMounted = true; // Track component mount state
    const geocodeDelay = 1000; // 1-second delay between requests (respects Nominatim's rate limit)

    if (!formData.location || formData.location.trim() === '') {
      // Clear coordinates if location is empty
      if (isMounted) {
        setFormData((prev) => ({
          ...prev,
          latitude: null,
          longitude: null,
        }));
      }
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            formData.location
          )}`,
          {
            headers: {
              'User-Agent': 'CityPulse App', // Required by Nominatim's usage policy
            },
            timeout: 5000, // 5-second timeout
          }
        );

        if (!isMounted) return; // Prevent state updates if unmounted

        if (response.data && response.data[0]) {
          const coords = {
            latitude: parseFloat(response.data[0].lat),
            longitude: parseFloat(response.data[0].lon),
            location: formData.location, // Preserve the original input
          };
          setFormData((prev) => ({
            ...prev,
            ...coords,
          }));
        } else {
          setError('Location not found. Please try a different address.');
        }
      } catch (error) {
        if (!isMounted) return;

        if (error.code === 'ECONNABORTED') {
          setError('Geocoding request timed out');
        } else if (error.response?.status === 429) {
          setError('Too many requests. Please wait before trying again.');
        } else {
          setError('Failed to geocode location. Please try again.');
        }
        console.error('Geocoding error:', error);
      }
    }, geocodeDelay);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [formData.location]);

  // Update the map center
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      setMapCenter([formData.latitude, formData.longitude]);
    }
  }, [formData.latitude, formData.longitude]);

  // Fetch table data
  useEffect(() => {
    const fetchData = async () => {
      if (showMap) return;
      try {
        const response = await axios.get('http://localhost:8000/issues/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setTableData(response.data);
      } catch (error) {
        setError('Failed to load issues. Please try again.');
        console.error('Fetch error:', error);
      }
    };
    fetchData();
  }, [showMap]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location: 'Current Location',
        }));
        setLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location');
        console.error('Geolocation error:', error);
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.category === 'other' && !formData.customCategory.trim()) {
      setError('Please enter a custom category.');
      setLoading(false);
      return;
    }

    if (
      !formData.subject ||
      !formData.description ||
      (!formData.location && (!formData.latitude || !formData.longitude))
    ) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const reportData = {
      subject: formData.subject.trim(),
      category:
        formData.category === 'other'
          ? formData.customCategory.trim()
          : formData.category,
      description: formData.description.trim(),
      location: formData.location.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

    try {
      const formDataToSend = new FormData();
      Object.entries(reportData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      if (formData.media) {
        formDataToSend.append('media', formData.media);
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('You must be logged in to submit a report.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:8000/report/',
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        setFormData({
          subject: '',
          category: '',
          customCategory: '',
          description: '',
          location: '',
          latitude: null,
          longitude: null,
          media: null,
        });
        setSuccess('Issue reported successfully!');
        setError(null);

        const issuesResponse = await axios.get(
          'http://localhost:8000/issues/',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTableData(issuesResponse.data);
        setShowMap(false);
      }
    } catch (error) {
      const errorMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Failed to submit issue';
      setError(errorMsg);
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  //-----------------------MAP component-------------------------------
  const MapCard = () => {
    return (
      <div style={{ height: '400px', position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={formData.latitude && formData.longitude ? 13 : 2}
          style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        >
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {formData.latitude && formData.longitude && (
            <Marker position={[formData.latitude, formData.longitude]}>
              <Popup>{formData.location || 'Location'}</Popup>
            </Marker>
          )}
          {tableData
            .filter((item) => item.latitude && item.longitude)
            .map((issue) => (
              <Marker
                key={issue.id}
                position={[issue.latitude, issue.longitude]}
              >
                <Popup>
                  <div>
                    <strong>{issue.subject}</strong>
                    <br />
                    {issue.category}
                    <br />
                    {issue.location}
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
        <Button
          variant='dark'
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000,
          }}
          onClick={() => setShowMap(false)}
        >
          List
        </Button>
      </div>
    );
  };

  //-------------------------TABLE component----------------------------
  const TableCard = () => (
    <div style={{ height: '400px', position: 'relative', overflow: 'auto' }}>
      <Button
        variant='dark'
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          zIndex: 1000,
        }}
        onClick={() => setShowMap(true)}
      >
        Map
      </Button>
      <br />
      <br />
      <table className='table table-striped'>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Category</th>
            <th>Location</th>
            <th>Status</th>
            <th>Reported</th>
          </tr>
        </thead>
        <tbody>
          {tableData.length > 0 ? (
            tableData.map((item) => (
              <tr key={item.id}>
                <td>{item.subject}</td>
                <td>{item.category}</td>
                <td>{item.location}</td>
                <td>
                  <span
                    className={`badge bg-${
                      item.status === 'resolved'
                        ? 'success'
                        : item.status === 'in_progress'
                        ? 'warning'
                        : item.status === 'pending'
                        ? 'secondary'
                        : 'light'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{new Date(item.reported_at).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan='5'>No issues reported</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <Container className='d-flex flex-column align-items-center py-3'>
      <div className='text-center mb-3'>
        <Nav style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <Nav.Link href='/profile' className='link'>
            Profile
          </Nav.Link>
          <Nav.Link onClick={handleLogout} className='link'>
            Logout
          </Nav.Link>
        </Nav>
        <h1>
          <b>CityPulse</b>
        </h1>
        <p>
          <i>Your one-stop solution for city updates.</i>
        </p>
      </div>
      {error && (
        <Alert
          variant='danger'
          onClose={() => setError(null)}
          dismissible
          className='w-100'
          style={{ maxWidth: '1200px' }}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          variant='success'
          onClose={() => setSuccess(null)}
          dismissible
          className='w-100'
          style={{ maxWidth: '1200px' }}
        >
          {success}
        </Alert>
      )}

      <Card
        className='responsive-card pb-4 px-2'
        style={{ width: '100%', maxWidth: '1200px' }}
      >
        <Card.Body>
          <Card.Title className='text-center mt-3'>
            <h3 className='name'>
              <b>REPORT AN ISSUE</b>
            </h3>
          </Card.Title>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '30px',
              marginTop: '20px',
            }}
          >
            <div className='map-card' style={{ flex: '1', minWidth: '0' }}>
              {showMap ? <MapCard /> : <TableCard />}
            </div>
            <div style={{ flex: '1', minWidth: '0' }}>
              <Form onSubmit={handleSubmit}>
                <Form.Group className='mb-3'>
                  <Form.Label>Subject:</Form.Label>
                  <Form.Control
                    type='text'
                    name='subject'
                    placeholder='Subject'
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className='mb-3'>
                  <Form.Label>Category:</Form.Label>
                  {formData.category !== 'other' ? (
                    <Form.Select
                      name='category'
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value='' disabled>
                        Select a category
                      </option>
                      <option value='road'>Road</option>
                      <option value='electric_line'>Electric Line</option>
                      <option value='plumbing'>Plumbing</option>
                      <option value='garbage'>Garbage</option>
                      <option value='drainage'>Drainage</option>
                      <option value='other'>Other</option>
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type='text'
                      name='customCategory'
                      placeholder='Enter custom category'
                      value={formData.customCategory}
                      onChange={(e) => {
                        handleChange(e);
                        if (!e.target.value) {
                          setFormData((prev) => ({
                            ...prev,
                            category: '',
                            customCategory: '',
                          }));
                          alert('Please select a category again.');
                        }
                      }}
                      required
                    />
                  )}
                </Form.Group>
                <Form.Group className='mb-3'>
                  <Form.Label>Description:</Form.Label>
                  <Form.Control
                    as='textarea'
                    name='description'
                    placeholder='Describe briefly...'
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className='mb-3'>
                  <div className='d-flex justify-content-between align-items-center'>
                    <Form.Label>Location:</Form.Label>
                    <Badge
                      bg='dark'
                      as='button'
                      className='badge-button'
                      onClick={handleUseCurrentLocation}
                    >
                      Use Current Location
                    </Badge>
                  </div>
                  <Form.Control
                    type='text'
                    name='location'
                    placeholder='Enter location'
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className='mb-3'>
                  <Form.Label>Attachment (Optional):</Form.Label>
                  <Form.Control
                    type='file'
                    onChange={(e) =>
                      setFormData({ ...formData, media: e.target.files[0] })
                    }
                  />
                </Form.Group>
                <Button
                  variant='primary'
                  type='submit'
                  className='w-100'
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              </Form>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Home;
