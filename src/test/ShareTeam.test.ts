import { teamToShareString, parseSharedTeam, createShareUrl } from '../utils/shareTeam';

describe('Team Sharing', () => {
  const mockTeam = {
    name: 'Test Team',
    players: [
      { number: '23', name: 'Michael Jordan' },
      { number: '33', name: 'Larry Bird' }
    ]
  };

  describe('teamToShareString', () => {
    it('should encode a team object into a base64 string', () => {
      const result = teamToShareString(mockTeam);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
    });

    it('should handle empty player lists', () => {
      const emptyTeam = {
        name: 'Empty Team',
        players: []
      };
      const result = teamToShareString(emptyTeam);
      expect(result).toBeTruthy();
    });

    it('should handle special characters in names', () => {
      const specialTeam = {
        name: 'Team ★&()',
        players: [{ number: '7', name: 'José Ñ. Smith Jr.' }]
      };
      const result = teamToShareString(specialTeam);
      expect(result).toBeTruthy();
      const decoded = parseSharedTeam(result);
      expect(decoded).toEqual(specialTeam);
    });
  });

  describe('parseSharedTeam', () => {
    it('should decode a valid share string back into a team object', () => {
      const shareString = teamToShareString(mockTeam);
      const result = parseSharedTeam(shareString);
      expect(result).toEqual(mockTeam);
    });

    it('should return null for invalid share strings', () => {
      const result = parseSharedTeam('invalid-string');
      expect(result).toBeNull();
    });

    it('should handle malformed JSON', () => {
      // Create an invalid JSON string and encode it
      const invalidJson = btoa(encodeURIComponent('{malformed:json'));
      const result = parseSharedTeam(invalidJson);
      expect(result).toBeNull();
    });

    it('should handle non-base64 strings', () => {
      const result = parseSharedTeam('not-base64!@#');
      expect(result).toBeNull();
    });
  });

  describe('createShareUrl', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // Mock window.location
      const location = {
        ...originalLocation,
        origin: 'http://localhost:3000',
        pathname: '/',
      };
      Object.defineProperty(window, 'location', {
        value: location,
        writable: true
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
      });
    });

    it('should create a valid URL with the correct format', () => {
      const url = createShareUrl(mockTeam);
      expect(url).toMatch(/^http:\/\/localhost:3000\/#\/teams\/new\?share=/);
    });

    it('should include encoded team data that can be decoded', () => {
      const url = createShareUrl(mockTeam);
      const shareParam = new URL(url).hash.split('share=')[1];
      const decoded = parseSharedTeam(shareParam);
      expect(decoded).toEqual(mockTeam);
    });

    it('should preserve all team information in the URL', () => {
      const complexTeam = {
        name: 'Complex Team Name with Spaces',
        players: [
          { number: '1', name: 'Player One' },
          { number: '2', name: 'Player Two' },
          { number: '3', name: 'Player Three' }
        ]
      };
      const url = createShareUrl(complexTeam);
      const shareParam = new URL(url).hash.split('share=')[1];
      const decoded = parseSharedTeam(shareParam);
      expect(decoded).toEqual(complexTeam);
    });
  });
});
