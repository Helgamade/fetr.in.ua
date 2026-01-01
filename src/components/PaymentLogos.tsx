// Логотипы способов оплаты

export const CODPaymentLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-hidden="true"
  >
    <g fill="none" fillRule="evenodd">
      <path d="M0 0h24v24H0z"></path>
      <path 
        d="M20 13v2h-2a1.001 1.001 0 010-2h2zm-1 6H5c-.552 0-1-.449-1-1V8.813c.314.111.647.184 1 .184V9h14c.552 0 1 .449 1 1v1h-2c-1.654 0-3 1.346-3 3s1.346 3 3 3h2v1c0 .551-.448 1-1 1zM5 5h12c.552 0 1 .449 1 1v1H5v-.003c-.551 0-.999-.448-1-.999.001-.55.449-.998 1-.998zm15 2.184V6c0-1.654-1.346-3-3-3H5a3.004 3.004 0 00-3 2.997V18c0 1.654 1.346 3 3 3h14c1.654 0 3-1.346 3-3v-8a2.997 2.997 0 00-2-2.816z" 
        fill="currentColor"
      />
    </g>
  </svg>
);

export const WayForPayLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient x1="50%" y1="99.994%" x2="50%" y2="-.001%" id="wayforpay_svg__a">
        <stop stopColor="#69CDF9" offset="0%"></stop>
        <stop stopColor="#599EF2" offset="100%"></stop>
      </linearGradient>
      <linearGradient x1="50%" y1="100%" x2="50%" y2="-.001%" id="wayforpay_svg__c">
        <stop stopColor="#70FBF4" offset="0%"></stop>
        <stop stopColor="#69CDF9" offset="100%"></stop>
      </linearGradient>
      <path 
        d="M0 10v2.469c0 4.142 3.375 7.53 7.5 7.53s7.5-3.388 7.5-7.53v-2.47H0zm6.885 6.913v-1.711a1.851 1.851 0 01-1.229-1.744c0-1.025.825-1.853 1.844-1.853a1.853 1.853 0 01.615 3.597v1.711c0 .34-.277.618-.615.618a.618.618 0 01-.615-.618z" 
        id="wayforpay_svg__b"
      />
    </defs>
    <g fill="none" fillRule="evenodd">
      <path d="M0 0h24v24H0z"></path>
      <g transform="translate(5 2)">
        <path 
          d="M7.5 0C3.375 0 0 3.474 0 7.72V9h2.214V7.72c0-3.002 2.37-5.443 5.286-5.443 2.915 0 5.287 2.44 5.287 5.443V9H15V7.72C15 3.474 11.625 0 7.5 0z" 
          fill="url(#wayforpay_svg__a)"
        />
        <mask id="wayforpay_svg__d" fill="#fff">
          <use xlinkHref="#wayforpay_svg__b"></use>
        </mask>
        <path 
          d="M0 10v2.469c0 4.142 3.375 7.53 7.5 7.53s7.5-3.388 7.5-7.53v-2.47H0zm6.885 6.913v-1.711a1.851 1.851 0 01-1.229-1.744c0-1.025.825-1.853 1.844-1.853a1.853 1.853 0 01.615 3.597v1.711c0 .34-.277.618-.615.618a.618.618 0 01-.615-.618z" 
          fill="url(#wayforpay_svg__c)" 
          mask="url(#wayforpay_svg__d)"
        />
      </g>
    </g>
  </svg>
);

export const FOPPaymentLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    fill="none" 
    viewBox="0 0 24 24" 
    className={className}
    aria-hidden="true"
  >
    <path 
      fill="currentColor" 
      d="M21 8.94a1.307 1.307 0 00-.06-.27v-.09a1.07 1.07 0 00-.19-.28l-6-6a1.071 1.071 0 00-.28-.19.32.32 0 00-.09 0 .88.88 0 00-.33-.11H6a3 3 0 00-3 3v14a3 3 0 003 3h12a3 3 0 003-3V8.94zm-6-3.53L17.59 8H16a1 1 0 01-1-1V5.41zM19 19a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1h7v3a3 3 0 003 3h3v9z"
    />
    <path 
      fill="currentColor" 
      d="M8 16h6a1 1 0 010 2H8a1 1 0 010-2zm0-4h8a1 1 0 010 2H8a1 1 0 010-2zm0-4h2a1 1 0 110 2H8a1 1 0 010-2z"
    />
  </svg>
);

