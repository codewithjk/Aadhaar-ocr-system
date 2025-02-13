

const extractName = (text: any) => {
    const lines = text.split('\n');
    let name = '';

    for (const line of lines) {
        if (line.toLowerCase().includes('government') ||
            line.toLowerCase().includes('india') ||
            line.toLowerCase().includes('aadhaar') ||
            line.toLowerCase().includes('uid')) {
            continue;
        }
        if (line.match(/^[A-Za-z\s]{2,50}$/)) {
            name = line.trim();
            break;
        }
    }
    return name;
};

const extractPincode = (address: any) => {
    const pincodeMatch = address.match(/\b\d{6}\b/);
    const pincodeIndex = pincodeMatch ? address.indexOf(pincodeMatch[0]) : -1;

    return {
        pincode: pincodeMatch ? pincodeMatch[0] : '',
        index: pincodeIndex
    };
};

const cleanAddress = (address: any): string => {
    // Check if "S/O", "W/O", or "D/O" exists and start from there
    const match = address.match(/\b(S\/O|W\/O|D\/O)\b/i);
    if (match) {
        // Start the address from the first occurrence of "S/O", "W/O", or "D/O"
        address = address.substring(address.indexOf(match[0]));
    }
    return address
        .replace(/\bwww\b/gi, '') // Remove standalone "www"
        .replace(/\b\d{6}\b/g, '') // Remove 6-digit postal codes
        .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, '') // Remove Aadhaar numbers
        .replace(/\b1947\b/g, '') // Remove standalone "1947"
        .replace(/Kerala.*/gi, 'Kerala') // Remove anything after "Kerala"
        .replace(/,\s*,+/g, ',') // Remove extra commas
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .replace(/,\s*\./g, '.') // Remove trailing commas before periods
        .replace(/\s*\.\s*$/g, '') // Remove trailing periods
        .replace(/,(\s*,\s*)+/g, ',') // Remove consecutive commas
        .replace(/,\s*$/g, '') // Remove trailing commas
        .trim();
};



const formatFinalAddress = (address: string): string => {
    return address
        .split(',')
        .map((part: string) => part.trim()) // Specify the type for `part`
        .filter((part: string) => part.length > 0) // Ensure `part` is a string
        .join(', ')
        .replace(/\s*\.$/, '') // Remove trailing period if any
        + '.';
};

export const extractAadhaarDetails = (frontText: any, backText: any) => {
    const details = {
        name: '',
        aadhaarNumber: '',
        dob: '',
        gender: '',
        address: '',
        pincode: ''
    };
    const frontLines = frontText.split('\n');
    frontLines.forEach((line: string) => {
        const aadhaarMatch = line.match(/[0-9]{4}\s[0-9]{4}\s[0-9]{4}/);
        if (aadhaarMatch) {
            details.aadhaarNumber = aadhaarMatch[0];
        }
        const yearMatch = line.match(/\b\d{4}\b/);
        if (yearMatch) {
            const year = parseInt(yearMatch[0], 10);
            // Optional: Validate that the year is within a reasonable range (e.g., 1900 to current year)
            const currentYear = new Date().getFullYear();
            if (year >= 1900 && year <= currentYear) {
                details.dob = year.toString();
            }
        }
        const dobMatch = line.match(/(\d{2}\/\d{2}\/\d{4})|(\d{2}-\d{2}-\d{4})/);
        if (dobMatch) {
            details.dob = dobMatch[0];
        }


        if (line.toLowerCase().includes('mal')) {
            details.gender = line.toLowerCase().includes('female') ? 'FEMALE' : 'MALE';
        }
    });

    details.name = extractName(frontText);
    const backLines = backText.split('\n');
    let addressLines: any = [];
    let isAddress = false;

    backLines.forEach((line: string) => {
        if (line.toLowerCase().includes('address:') || line.toLowerCase().includes('add:')) {
            isAddress = true;
            line = line.replace(/address:|add:/i, '').trim();
            if (line) addressLines.push(line);
        } else if (isAddress && line.trim()) {
            addressLines.push(line.trim());
        }
    });

    if (addressLines.length > 0) {
        let fullAddress = addressLines.join(', ');
        const { pincode } = extractPincode(fullAddress);

        if (pincode) {
            details.pincode = pincode;
        }

        fullAddress = cleanAddress(fullAddress);
        details.address = formatFinalAddress(fullAddress);
    }
    return details;
};

