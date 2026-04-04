// Converts "1 1/2" or "3/4" or "0.5" into 1.5, 0.75, 0.5
export const fractionToDecimal = (str) => {
    if (!str) return '';
    const s = str.toString().trim();
    try {
        if (s.includes('/')) {
            const parts = s.split(' ').filter(p => p); // split whole number and fraction
            if (parts.length === 2) {
                const whole = parseFloat(parts[0]);
                const frac = parts[1].split('/');
                return whole + (parseFloat(frac[0]) / parseFloat(frac[1]));
            } else if (parts.length === 1) {
                const frac = parts[0].split('/');
                return parseFloat(frac[0]) / parseFloat(frac[1]);
            }
        }
        return parseFloat(s);
    } catch (e) {
        return parseFloat(s);
    }
};

// Converts 1.5 or 0.75 into "1 1/2" or "3/4"
export const decimalToFraction = (num) => {
    if (num === null || num === undefined || num === '' || isNaN(num)) return num || '';
    const n = parseFloat(num);
    const whole = Math.floor(n);
    const decimal = n - whole;

    // Standard cooking measurements
    const fractions = [
        { val: 0.125, text: '1/8' }, { val: 0.25, text: '1/4' },
        { val: 0.33, text: '1/3' }, { val: 0.333, text: '1/3' },
        { val: 0.5, text: '1/2' }, { val: 0.66, text: '2/3' },
        { val: 0.666, text: '2/3' }, { val: 0.75, text: '3/4' }
    ];

    let closest = null;
    for (let f of fractions) {
        if (Math.abs(decimal - f.val) < 0.02) { // Allow tiny margin of error
            closest = f.text;
            break;
        }
    }

    if (closest) return whole > 0 ? `${whole} ${closest}` : closest;
    return whole === n ? n.toString() : Number(n.toFixed(2)).toString();
};
