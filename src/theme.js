export const theme = {
    colors: {
        background: '#F4F7FE', // Very light cool gray/blueish background (Premium feel)
        surface: '#FFFFFF',    // White for cards
        primary: '#4318FF',    // Electric Blue/Purple (Vibrant & Modern)
        secondary: '#6AD2FF',  // Light Blue accent
        accent: '#E01E5A',     // Pinkish Red for hearts/active states
        text: '#1B254B',       // Deep Navy Blue (High contrast, softer than black)
        textSecondary: '#A3AED0', // Cool Gray
        border: '#E0E5F2',
        inputBackground: '#F4F7FE', // Matches background for neat inputs
        success: '#05CD99',
        error: '#EE5D50',
    },
    typography: {
        header: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
        subHeader: { fontSize: 18, fontWeight: '600' },
        body: { fontSize: 14, color: '#A3AED0' },
    },
    layout: {
        borderRadius: 20, // Modern rounded corners
        cardPadding: 20,
    },
    shadows: {
        medium: {
            shadowColor: "#4318FF",
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 5,
        },
        soft: {
            shadowColor: "#868CFF",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
        }
    }
};
