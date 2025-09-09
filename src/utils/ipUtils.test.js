import {
    validateIp,
    getIpVersion,
    validateSubnet,
    isPublicIp,
    isSameSubnet,
    checkIpAndSubnet
} from './ipUtils';

describe('ipUtils', () => {
    describe('validateIp', () => {
        it('should return true for valid IPv4 addresses', () => {
            expect(validateIp('192.168.1.1')).toBe(true);
            expect(validateIp('10.0.0.1')).toBe(true);
        });

        it('should return true for valid IPv6 addresses', () => {
            expect(validateIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
            expect(validateIp('::1')).toBe(true);
        });

        it('should return false for invalid IP addresses', () => {
            expect(validateIp('256.256.256.256')).toBe(false);
            expect(validateIp('192.168.1')).toBe(false);
            expect(validateIp('not an ip')).toBe(false);
        });
    });

    describe('getIpVersion', () => {
        it('should return ipv4 for IPv4 addresses', () => {
            expect(getIpVersion('192.168.1.1')).toBe('ipv4');
        });

        it('should return ipv6 for IPv6 addresses', () => {
            expect(getIpVersion('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('ipv6');
        });

        it('should return null for invalid IP addresses', () => {
            expect(getIpVersion('not an ip')).toBeNull();
        });
    });

    describe('validateSubnet', () => {
        it('should return true for valid CIDR subnets', () => {
            expect(validateSubnet(24, '192.168.1.1')).toBe(true);
            expect(validateSubnet('24', '192.168.1.1')).toBe(true);
        });

        it('should return true for valid dotted-decimal subnets', () => {
            expect(validateSubnet('255.255.255.0', '192.168.1.1')).toBe(true);
        });

        it('should return false for invalid subnets', () => {
            expect(validateSubnet(33, '192.168.1.1')).toBe(false);
            expect(validateSubnet('255.255.255.256', '192.168.1.1')).toBe(false);
            expect(validateSubnet('not a subnet', '192.168.1.1')).toBe(false);
        });
    });

    describe('isPublicIp', () => {
        it('should return true for public IP addresses', () => {
            expect(isPublicIp('8.8.8.8')).toBe(true);
        });

        it('should return false for private IP addresses', () => {
            expect(isPublicIp('192.168.1.1')).toBe(false);
            expect(isPublicIp('10.0.0.1')).toBe(false);
            expect(isPublicIp('172.16.0.1')).toBe(false);
        });
    });

    describe('isSameSubnet', () => {
        it('should return true for IPs in the same subnet', () => {
            expect(isSameSubnet('192.168.1.1', '192.168.1.100', 24)).toBe(true);
        });

        it('should return false for IPs in different subnets', () => {
            expect(isSameSubnet('192.168.1.1', '192.168.2.1', 24)).toBe(false);
        });

        it('should return false for IPs of different versions', () => {
            expect(isSameSubnet('192.168.1.1', '::1', 24)).toBe(false);
        });
    });

    describe('checkIpAndSubnet', () => {
        it('should return null for valid host IPs', () => {
            expect(checkIpAndSubnet('192.168.1.1', 24)).toBeNull();
        });

        it('should return an error for network addresses', () => {
            expect(checkIpAndSubnet('192.168.1.0', 24)).toBe('IP address cannot be the network address.');
        });

        it('should return an error for broadcast addresses', () => {
            expect(checkIpAndSubnet('192.168.1.255', 24)).toBe('IP address cannot be the broadcast address.');
        });
    });
});
