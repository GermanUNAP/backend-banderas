const jwt = require('jsonwebtoken');

class JWT {
  constructor() {
    this.accessSecret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.accessExpiresIn = process.env.JWT_EXPIRES_IN || '8h';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (!this.accessSecret || !this.refreshSecret) {
      throw new Error('JWT secrets must be defined in environment variables');
    }
  }

  generateAccessToken(payload) {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
      issuer: 'countries-app',
      audience: 'user'
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
      issuer: 'countries-app',
      audience: 'refresh'
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessSecret, {
        issuer: 'countries-app',
        audience: 'user'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token has expired. Please refresh your token.');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token format.');
      } else {
        throw new Error('Access token verification failed.');
      }
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        issuer: 'countries-app',
        audience: 'refresh'
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  generateTokens(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({ id: payload.id });

    return {
      accessToken,
      refreshToken
    };
  }

  refreshAccessToken(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken);
    const newPayload = { id: decoded.id, email: decoded.email };

    return {
      accessToken: this.generateAccessToken(newPayload)
    };
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }
}

module.exports = JWT;