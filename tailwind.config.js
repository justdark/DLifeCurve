/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        money: '#F2C94C',      // 黄 - 金钱
        time: '#F2994A',       // 橙 - 时间
        exp: '#9B72CF',        // 紫 - 体验
        ink: '#1F2937',
        canvas: '#FAFAF7',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'PingFang SC', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.04)',
        lift: '0 8px 32px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
