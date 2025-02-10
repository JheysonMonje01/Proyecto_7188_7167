import { useState } from "react";
import { Button, Container } from "react-bootstrap";
import VerifyCoverageModal from "../components/VerificarCobertura";

const RegisterClient = () => {
  const [showModal, setShowModal] = useState(true);
  const [canRegister, setCanRegister] = useState(false);

  return (
    <Container>
      {/* Modal de cobertura */}
      <VerifyCoverageModal
        show={showModal}
        handleClose={() => setShowModal(false)} 
        handleSuccess={() => {
          setShowModal(false);
          setCanRegister(true);
        }}
      />

      {/* Solo mostrar el formulario si se permite */}
      {canRegister && (
        <div>
          <h2>Formulario de Registro de Cliente</h2>
          <p>Aquí irá el formulario...</p>
          <Button variant="primary">Registrar Cliente</Button>
        </div>
      )}
    </Container>
  );
};

export default RegisterClient;
