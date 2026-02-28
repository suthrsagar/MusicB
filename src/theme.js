export const theme = {
    colors: {
        background: '#F4F7FE',
        surface: '#FFFFFF',
        primary: '#4318FF',
        secondary: '#6AD2FF',
        accent: '#E01E5A',
        text: '#1B254B',
        textSecondary: '#A3AED0',
        border: '#E0E5F2',
        inputBackground: '#F4F7FE',
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
