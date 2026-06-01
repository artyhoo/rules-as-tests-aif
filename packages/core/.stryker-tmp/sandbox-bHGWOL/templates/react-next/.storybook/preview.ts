// @ts-nocheck
import type { Preview } from '@storybook/react';
// import '../src/app/globals.css'; // uncomment if consumer project uses Tailwind

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
