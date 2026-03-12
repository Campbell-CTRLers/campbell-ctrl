import React from 'react';
import { ThemeContext } from './themeContext';

export const useTheme = () => React.useContext(ThemeContext);
