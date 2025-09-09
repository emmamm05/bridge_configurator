import ipaddr from 'ipaddr.js';

/**
 * Validates if the provided ip string is a correct IPv4 or IPv6 address.
 * @param {string} ip - The IP address to validate.
 * @returns {boolean} - True if the IP is valid, false otherwise.
 */
export const validateIp = (ip) => {
    if (ipaddr.IPv6.isValid(ip)) {
        return true;
    }
    if (ipaddr.IPv4.isValidFourPartDecimal(ip)) {
        return true;
    }
    return false;
};

/**
 * Returns the version ('ipv4' or 'ipv6') of the provided ip string.
 * @param {string} ip - The IP address to get the version from.
 * @returns {string|null} - 'ipv4', 'ipv6', or null if the IP is invalid.
 */
export const getIpVersion = (ip) => {
    if (ipaddr.isValid(ip)) {
        return ipaddr.parse(ip).kind();
    }
    return null;
};

/**
 * This internal function converts a subnet mask into its CIDR prefix length.
 * It can handle both CIDR notation (e.g., 24) and, for IPv4, dotted-decimal
 * notation (e.g., 255.255.255.0). The ipForVersionDetection is used to
 * determine whether to apply IPv4 or IPv6 validation rules.
 * @param {string|number} subnet - The subnet mask to convert.
 * @param {string} ipForVersionDetection - An IP address to determine the IP version for validation.
 * @returns {number|null} - The CIDR prefix length or null if the subnet is invalid.
 */
const convertSubnetToCidr = (subnet, ipForVersionDetection) => {
    if (!subnet) return null;
    const subnetString = String(subnet).trim();
    const ipVersion = getIpVersion(ipForVersionDetection) || 'ipv4';

    // Check for CIDR
    if (!isNaN(subnetString)) {
        const cidr = parseInt(subnetString, 10);
        const maxCidr = ipVersion === 'ipv6' ? 128 : 32;
        if (Number.isInteger(cidr) && cidr >= 0 && cidr <= maxCidr) {
            return cidr;
        }
    }

    // Check for dotted-decimal (only for IPv4)
    if (ipVersion === 'ipv4' && ipaddr.IPv4.isValid(subnetString)) {
        try {
            const addr = ipaddr.IPv4.parse(subnetString);
            return addr.prefixLengthFromSubnetMask();
        } catch (e) {
            return null;
        }
    }

    return null;
};

/**
 * Checks if a subnet is valid for a given ipAddress.
 * @param {string|number} subnet - The subnet mask to validate.
 * @param {string} ipAddress - The IP address to validate the subnet against.
 * @returns {boolean} - True if the subnet is valid, false otherwise.
 */
export const validateSubnet = (subnet, ipAddress) => {
    return convertSubnetToCidr(subnet, ipAddress) !== null;
};

/**
 * Determines if the given ip is a public IP address.
 * @param {string} ip - The IP address to check.
 * @returns {boolean} - True if the IP is a public IP, false otherwise.
 */
export const isPublicIp = (ip) => {
    if (!validateIp(ip)) return false;
    
    try {
        const addr = ipaddr.parse(ip);
        const range = addr.range();
        return range === 'unicast';
    } catch (e) {
        return false;
    }
};

/**
 * Checks if two IP addresses, ip1 and ip2, belong to the same subnet.
 * @param {string} ip1 - The first IP address.
 * @param {string} ip2 - The second IP address.
 * @param {string|number} subnet - The subnet mask.
 * @returns {boolean} - True if the IPs are in the same subnet, false otherwise.
 */
export const isSameSubnet = (ip1, ip2, subnet) => {
    const cidr = convertSubnetToCidr(subnet, ip1);
    if (!validateIp(ip1) || !validateIp(ip2) || cidr === null) {
        return false;
    }
    try {
        const addr1 = ipaddr.parse(ip1);
        const addr2 = ipaddr.parse(ip2);

        if (addr1.kind() !== addr2.kind()) {
            return false;
        }
        
        return addr1.match(addr2, cidr);
    } catch (e) {
        return false;
    }
};

/**
 * Checks if the provided ip is a valid host address within the given subnet.
 * @param {string} ip - The IP address to check.
 * @param {string|number} subnet - The subnet mask.
 * @returns {string|null} - An error message if the IP is invalid, null otherwise.
 */
export const checkIpAndSubnet = (ip, subnet) => {
    const cidr = convertSubnetToCidr(subnet, ip);
    if (!validateIp(ip) || cidr === null) {
        return 'Invalid IP or Subnet format.';
    }
    try {
        const addr = ipaddr.parse(ip);
        if (addr.kind() === 'ipv4') {
            const cidrStr = `${ip}/${cidr}`;
            const networkAddress = ipaddr.IPv4.networkAddressFromCIDR(cidrStr).toString();
            const broadcastAddress = ipaddr.IPv4.broadcastAddressFromCIDR(cidrStr).toString();

            if (ip === networkAddress && cidr < 31) {
                return 'IP address cannot be the network address.';
            }
            if (ip === broadcastAddress && cidr < 31) {
                return 'IP address cannot be the broadcast address.';
            }
        } else { // ipv6
            const networkAddress = addr.mask(cidr).toString();
            if (ip === networkAddress && cidr < 127) {
                return 'IP address cannot be the network address.';
            }
        }
        return null; // No error
    } catch (e) {
        return 'Invalid subnet mask.';
    }
};