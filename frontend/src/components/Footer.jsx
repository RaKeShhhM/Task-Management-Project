const Footer = () => {
  return (
    <footer style={footerStyle}>
      <p style={{ margin: 0 }}>
        © {new Date().getFullYear()} TeamBoard — built with the MERN stack
      </p>
    </footer>
  );
};

const footerStyle = {
  textAlign: "center",
  padding: "16px",
  borderTop: "1px solid #e5e7eb",
  color: "#9ca3af",
  fontSize: "13px",
  marginTop: "auto", // pushes footer to bottom when content is short (with flex layout)
};

export default Footer;