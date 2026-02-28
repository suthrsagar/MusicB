export const theme = {
    colors: {
        background: '#050505',
        surface: 'rgba(255, 255, 255, 0.05)',
        primary: '#4318FF',
        secondary: '#6AD2FF',
        accent: '#E01E5A',
        text: '#FFFFFF',
        textSecondary: '#A3AED0',
        border: 'rgba(255, 255, 255, 0.1)',
        inputBackground: 'rgba(255, 255, 255, 0.08)',
        success: '#05CD99',
        error: '#EE5D50',
    },
    typography: {
        header: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
        subHeader: { fontSize: 18, fontWeight: '600' },
        body: { fontSize: 14, color: '#A3AED0' },
    },
    layout: {
        borderRadius: 20,
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
