import React, { useState, useEffect } from "react";
import { Box, VStack, Grid, Text, Button, Flex, Icon, Code, useToast, Spinner } from "@chakra-ui/react";
import { ShieldCheck, Download, RefreshCw, FileKey, Terminal, CheckCircle2, AlertTriangle } from "lucide-react";
import { mqttTheme } from "./theme";
import { TraxoApi } from "../../utils/TraxoApi";
import { verifyCertificate } from "../../services/certificateApi";

const ROOT_CA_PEM = `-----BEGIN CERTIFICATE-----
MIIFszCCBBugAwIBAgIRAOHNW/n+kRTV5Qs2pkK9R7EwDQYJKoZIhvcNAQELBQAw
ajEQMA4GA1UEBxMHQ2hlbm5haTELMAkGA1UECBMCVE4xEDAOBgNVBAsTB0NpdHJv
b24xEzARBgNVBAoTClN0ZWxsYW50aXMxCzAJBgNVBAYTAklOMRUwEwYDVQQDEwxD
bklQIFJvb3QgQ0EwIBcNMjIwNzI2MDcwMzAwWhgPMjA2MjA3MTYwNzAzMDBaMGox
EDAOBgNVBAcTB0NoZW5uYWkxCzAJBgNVBAgTAlROMRAwDgYDVQQLEwdDaXRyb2Vu
MRMwEQYDVQQKEwpTdGVsbGFudGlzMQswCQYDVQQGEwJJTjEVMBMGA1UEAxMMQ1ZJ
UCBSb290IENBMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAunwRsFZA
OAHfSvAGVOngV0K0D33nSWSMXYGBxekhHgK6SuzXOqG/a4B3aye7zY9HD4L++BCK
t8YLpNf3uSzltM5qWih0XOVDy54Yj7XeCZgXoKOddNPIuoc44UsFOPKvtCguucAr
sLwBwYGUbBd+91QAYwuiZFopCI06Zj8oTjlP3dWkfpIpFZZ+yKAPVZUzEvQHdM5R
JUlk3oS87Mb+HNhdsq10p0uZYkz9mBB9mVKZqPssB8adBBfeLgyfQb46oztwx4pL
2HDTmCaPpcEMqLCoW239NlUBg1jC0KVaHTcjQ0FWj3IMeHOHiDyw0YnIp5ZkAAUg
pOGa9fNkTYyU3zaqj1Ece6qbHE/rcZZ/07GCYIV86k5L7EHfWCbsZfAadhEc+Faa
V0FbYvAkp5isRyGwGBAeD4nNwfMq2oCiSfYKLcBZdy6wY+b8djNX92SYsR2Cotn8
2IoODsoZ7iWD1oYuL3kpNGY079Jn9hkQUR8QRaXPGjQIKMMMMTDsSHjAgMBAAGj
ggFQMIIBTDAPBgNVHRMECDAGAQH/AgEBMAsGA1UdDwQEAwIBBjAfBgNVHSMEGDAW
gBQgu7e/HAn7NquleBnf0TXmDt5VETAdBgNVHQ4EFgQUILu3vxwJ+zarpXgZ39E1
5g7eVREwTAYDVR0fBEUwQzBBoD+gPYY7aHR0cHM6Ly9tcGtpLWludC5lbemuZHhh
LmNvbS9lbUNBL1JlcG9zaXRvcnkvQ1ZJUFJvb3RDQS5jcmwwgZ0GA1UdIASBlTCB
kjCBjwYHYIJkZAEIAjCBgzCBgAYIKwYBBQUHAgIwdB5yAGgAdAB0AHAAcwA6AC8A
LwBtAHAAawBpAC0AaQBuAHQALgBlAG0AdQBkAGgAcgBhAC4AYwBvAG0ALwBlAG0A
QwBBAC8AUgBlAHAAbwBzAGkAdABvAHIAeQAvAGMAYQBwAG8AbABpAGMAeQAuAHAA
ZABmMA0GCSqGSIb3DQEBCwUAA4IBgQCwTq71VSZslVvFl/DmwiRvP/qvJZdCNZSv
GAHqp0h0/JWwUELs7O9jHP8nHf8/4ckBQJ17rFCnvvlF+Yf27b1T0YEmtT1IYGDn
P5sX/05kTXijWQ21TMDYfxZ2qmEML8fcKUyoT1XeMXTzokyki2BjWaokzPXhBpve
TzQZ2djPCwtOtqKaxdZzHbWyFI5JmpmkpuLNIvnC1o52lP6fJkJnZpueL3OO5xR7
X631siTwBJmloN1ac4hEML9RcgOammUmGUiqRa5LDaLc/JIXD6jWGqYYUdaBK2NF
O6yGsjv7kjs+LEobYjH94Sppbq7U51Md/uJcSf57GiT51lMXIAEIjaG5rU49GU8R
IbK9DJ0G5Qf4NzvElUvgl6ZEdA1NGRCFdJzuwrBWB07oDesB6ncHeo3Wm/dSLcgv
02IwQz+l9NwxVH7HVsvpgA+ydVxnf8K22iOmD54HHcjKfSd/tAPZ38RWVfFHTFUF
ykdotBB9wXLwKodWsybDDQUxlFGuxyY=
-----END CERTIFICATE-----`;

const INTERMEDIATE_CA_PEM = `-----BEGIN CERTIFICATE-----
MIIFpDCCBAygAwIBAgIQciqdKLoATqD54dZAQ6CVDDANBgkqhkiG9w0BAQsFADBq
MRAwDgYDVQQHEwdDaGVubmFpMQswCQYDVQQIEwJUTjEQMA4GA1UECxMHQ2l0cm9l
bjETMBEGA1UEChMKU3RlbGxhbnRpczELMAkGA1UEBhMCSU4xFTATBgNVBAMTDENW
SVAgUm9vdCBDQTAgFw0yMjA3MjYwNzEwMzVaGA8yMDYyMDcxMTA3MTAzNVowVDEQ
MA4GA1UECxMHQ2l0cm9lbjETMBEGA1UEChMKU3RlbGxhbnRpczELMAkGA1UEBhMC
SU4xHjAcBgNVBAMTFUNWSVAgVGJveCBQcmVwcm9kIElDQTCCAaIwDQYJKoZIhvcN
AQEBBQADggGPADCCAYoCggGBALaJqpaF9+jlgzeVSDlJThXx561ln8BJ9Vxa0o1d
fblccUqzXzHD669sgrAujG4rq1Y6hZVcevHFgAQOOvqPt1Q/GPUu6r2sF570vTsf
R7RpVvMkX+TeNFO7hfPwzzXJMn5mOXyR02djnkCSgLuauVvQ+2lIZkcWEgSzc46m
cMapMwQ+bFroA1BZDgF1OvEIMEv0SrPw38kdPfpEwLwsvQn07I3hoBKb2FJ1+HYZ
5UlTLU4PyIX37n5reZUjL3dG/N+paaTRRbC7/fcjdUmGzgNgNYY9QdbyIARasTfs
1KuwkSv8oAMLg+jd2lviy532acxtKMhYAyZZtsN+yfiDjJVwgox86ntXsARgOS+C
HGlMQGOiF1fVEIP6/v9rk8JgVxyc7arCV/0zy5VyGMjEaaEhLFgJOKn9fhWK+nvp
uUY5O2Uvd2Zk6TS6+puYN6nOqQTnwtqDpPlahaQ1u7geh0CFCJiMiMQ6z8rHZuo8
npFgFBEbdEO5wVCYCJKx+AkkfwIDAQABo4IBWDCCAVQwDwYDVR0TBAgwBgEB/wIB
ADALBgNVHQ8EBAMCAQYwHwYDVR0jBBgwFoAUILu3vxwJ+zarpXgZ39E15g7eVREw
HQYDVR0OBBYEFFQogLfkpJU8a4lRvZ6A/37ruHswMFQGA1UdHwRNMEswSaBHoEWG
Q2h0dHBzOi8vbXBraS1pbnQuZW11ZGhyYS5jb20vZW1DQS9SZXBvc2l0b3J5L0NW
SVBUYm94UHJlcHJvZElDQS5jcmwwgZ0GA1UdIASBlTCBkjCBjwYHYIJkZAEIAjCB
gzCBgAYIKwYBBQUHAgIwdB5yAGgAdAB0AHAAcwA6AC8ALwBtAHAAawBpAC0AaW50
LmVtdWRocmEuY29tL2VtQ0EvUmVwb3NpdG9yeS9jYXBvbGljeS5wZGYwDQYJKoZI
bvcNAQELBQADggGBACHFD8V3wELYa9RBX6DFL3UEubG4usp9Ff2oqrUXQWljQUNO
GCjIz3z8u/M+qkiKO2lDUnWGHpJXbjeKmkiBO8djYThp4751g3cHoyisHGyhIoJD
7YnNlpCIkhwkMGX6fE45G/h41EarE8ofqxFOwPHiY0poG0h3twFni39+XpiRHQ0Y
224eUOoVMHxO563O9ToM4IQUWJmZKOYDREwjaIlRpvhJowYTp7adeQSrdV8aYOG
LaHsPtSAsS+L7++MDTnOFrmtgn5f/nmtiyflww1xHeSjfB/QmG9kfi4Jpw2x7iw
4nMqrRcQHu2OR+MqDkDk0h88/pAOKBIWA9OUCM16GtaHis+Y0oQamKhj6vHr0rJO
DxPfZowj3hxA6zpmH00stVDPMweQotkgl4EgD7lrPVHrAf+l9al60+1f5apantI
xIv/ze4NDrwPtLBwQrDM8JVJRYE9N3uwAUl+gOYq/73phtAs50xBkY/b9dVenGx
DQ1avVwgQDFTDyIkAe97/M=
-----END CERTIFICATE-----`;

export const CertificatesView = ({ state, dispatch }) => {
  const toast = useToast();
  const [step, setStep] = useState(0); // 0=idle, 1=genKey, 2=createCSR, 3=callAPI, 4=done, -1=error
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [csrPem, setCsrPem] = useState("");
  const [certPem, setCertPem] = useState("");
  const [bundlePem, setBundlePem] = useState("");
  const [certB64, setCertB64] = useState("");
  const [error, setError] = useState("");
  const [certLog, setCertLog] = useState([]);
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const { vin, imei, tboxSerial } = state.config;
  const commonName = `${imei}-${tboxSerial}`;

  const addLog = (msg) => setCertLog(l => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const toPem = (buffer, type) => {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const lines = b64.match(/.{1,64}/g).join("\n");
    return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----\n`;
  };

  const buildCsr = async (privateKey, publicKey) => {
    const spkiDer = await crypto.subtle.exportKey("spki", publicKey);
    const encode = (str) => new TextEncoder().encode(str);
    
    const tlv = (tag, value) => {
      const arr = Array.isArray(value) ? value : Array.from(value);
      const len = arr.length;
      if (len < 128) return new Uint8Array([tag, len, ...arr]);
      if (len < 256) return new Uint8Array([tag, 0x81, len, ...arr]);
      return new Uint8Array([tag, 0x82, (len >> 8) & 0xff, len & 0xff, ...arr]);
    };

    const attr = (oid, val, tag = 0x13) => tlv(0x31, tlv(0x30, [...tlv(0x06, oid), ...tlv(tag, encode(val))]));

    const OID_C = [0x55, 0x04, 0x06];
    const OID_ST = [0x55, 0x04, 0x08];
    const OID_L = [0x55, 0x04, 0x07];
    const OID_O = [0x55, 0x04, 0x0a];
    const OID_OU = [0x55, 0x04, 0x0b];
    const OID_CN = [0x55, 0x04, 0x03];

    const subject = tlv(0x30, [
      ...attr(OID_C, "IN"),
      ...attr(OID_ST, "State"),
      ...attr(OID_L, "City"),
      ...attr(OID_O, "Traxo"),
      ...attr(OID_OU, "Software"),
      ...attr(OID_CN, commonName, 0x13)
    ]);

    const version = new Uint8Array([0x02, 0x01, 0x00]);
    const spki = new Uint8Array(spkiDer);
    const attrs = new Uint8Array([0xa0, 0x00]);
    const certRequestInfo = tlv(0x30, [...version, ...subject, ...spki, ...attrs]);
    
    const sig = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, privateKey, certRequestInfo);
    const algoId = new Uint8Array([0x30,0x0d,0x06,0x09,0x2a,0x86,0x48,0x86,0xf7,0x0d,0x01,0x01,0x0b,0x05,0x00]);
    const bitString = tlv(0x03, [0x00, ...new Uint8Array(sig)]);
    const csr = tlv(0x30, [...certRequestInfo, ...algoId, ...bitString]);
    return csr.buffer;
  };

  const handleGenerate = async () => {
    setStep(1); setError(""); setCertLog([]);
    setPrivateKeyPem(""); setCsrPem(""); setCertPem(""); setBundlePem(""); setCertB64("");
    setVerificationResult(null);
    
    try {
      const storageKey = `pki_keys_${commonName}`;
      const savedData = localStorage.getItem(storageKey);
      let keyPair;
      let existingCsrPem = "";
      let existingPrivPem = "";

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          addLog("Found existing key pair in local storage. Reusing...");
          existingPrivPem = parsed.privateKeyPem;
          existingCsrPem = parsed.csrPem;
          setPrivateKeyPem(existingPrivPem);
          setCsrPem(existingCsrPem);
          addLog("✓ Existing keys loaded successfully");
        } catch (e) {
          console.warn("Failed to parse saved keys:", e);
          localStorage.removeItem(storageKey);
        }
      }

      if (!existingPrivPem) {
        addLog("Generating NEW RSA-2048 key pair...");
        keyPair = await crypto.subtle.generateKey(
          { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
          true, ["sign", "verify"]
        );
        const privDer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        const privPem = toPem(privDer, "PRIVATE KEY");
        setPrivateKeyPem(privPem);
        existingPrivPem = privPem;
        addLog("✓ New RSA private key generated");

        setStep(2);
        addLog(`Building NEW CSR (Certificate Signing Request) for CN=${commonName}...`);
        const csrDer = await buildCsr(keyPair.privateKey, keyPair.publicKey);
        existingCsrPem = toPem(csrDer, "CERTIFICATE REQUEST");
        setCsrPem(existingCsrPem);
        addLog("✓ Cryptographic CSR created");

        localStorage.setItem(storageKey, JSON.stringify({
          privateKeyPem: existingPrivPem,
          csrPem: existingCsrPem
        }));
      }

      setStep(3);
      addLog("Sending CSR payload to CVIP CA Platform...");
      
      const csrBase64 = existingCsrPem
        .replace("-----BEGIN CERTIFICATE REQUEST-----", "")
        .replace("-----END CERTIFICATE REQUEST-----", "")
        .replace(/\s/g, "");

      const apiResp = await TraxoApi.createTboxCertificate(commonName, csrBase64);
      addLog("✓ Platform API signature completed");

      setStep(4);
      const certRaw = apiResp?.message || apiResp?.certificate || apiResp?.cert || "";
      if (!certRaw) throw new Error("Missing certificate string in API response payload.");
      
      const certBytes = Uint8Array.from(atob(certRaw), c => c.charCodeAt(0));
      const certPemStr = toPem(certBytes.buffer, "CERTIFICATE");
      setCertPem(certPemStr); 
      setCertB64(certRaw);
      addLog("✓ Certificate extracted and successfully formatted into PEM");

      const bundle = `${certPemStr}\n${INTERMEDIATE_CA_PEM}\n${ROOT_CA_PEM}`;
      setBundlePem(bundle);
      addLog("🎉 Certificate Generation Flow Complete!");
      
      // Automatic download triggered immediately upon generation success
      downloadFile(existingPrivPem, "device-key.key");
      setTimeout(() => downloadFile(existingCsrPem, "device.csr"), 200);
      setTimeout(() => downloadFile(certPemStr, "device-cert.crt"), 400);
      setTimeout(() => downloadFile(bundle, "cvip-ca-bundle.crt"), 600);
      addLog("✓ Automatically downloaded cryptographic materials package");
      
      // Update global context so other tabs can reference it
      if (dispatch) {
        dispatch({ type: "SET_CONFIG_FIELD", field: "certificate", value: certRaw });
        dispatch({ type: "ADD_TOAST", toast: { id: Date.now().toString(), message: "✓ Certificate Generated & Downloaded", type: "success" } });
      }
    } catch (e) {
      setStep(-1);
      const errorMsg = e.message || String(e);
      setError(errorMsg);
      addLog(`❌ Error: ${errorMsg}`);
    }
  };

  const handleVerify = async () => {
    if (!certB64) {
      toast({
        title: "No Certificate Found",
        description: "Please generate a certificate first before running verification.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVerifying(true);
    addLog("Initiating Secure Cryptographic Certificate Verification...");

    try {
      const payload = {
        vehicleId: vin,
        imeiNo: imei,
        TboxSerialNum: tboxSerial,
        certificate: certB64
      };

      const result = await verifyCertificate(payload);
      setVerificationResult(result);
      addLog(`✓ Platform Verification Check Completed: Status is ${result.status}`);
      
      if (dispatch) {
        dispatch({ 
          type: "ADD_TOAST", 
          toast: { id: Date.now().toString(), message: `✓ Certificate Verification: ${result.status}`, type: "success" } 
        });
      }
    } catch (e) {
      addLog(`❌ Verification Error: ${e.message || String(e)}`);
      toast({
        title: "Verification Failed",
        description: e.message || "An error occurred during verification",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const downloadFile = (content, filename) => {
    const iframeName = `download_iframe_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/device/download";
    form.target = iframeName;
    form.style.display = "none";

    const inputContent = document.createElement("input");
    inputContent.type = "hidden";
    inputContent.name = "content";
    inputContent.value = content;
    form.appendChild(inputContent);

    const inputFilename = document.createElement("input");
    inputFilename.type = "hidden";
    inputFilename.name = "filename";
    inputFilename.value = filename;
    form.appendChild(inputFilename);

    document.body.appendChild(form);
    form.submit();

    // Clean up DOM elements after trigger
    setTimeout(() => {
      document.body.removeChild(form);
      document.body.removeChild(iframe);
    }, 3000);
  };

  const handleDownloadAll = () => {
    downloadFile(privateKeyPem, "device-key.key");
    setTimeout(() => downloadFile(csrPem, "device.csr"), 200);
    setTimeout(() => downloadFile(certPem, "device-cert.crt"), 400);
    setTimeout(() => downloadFile(bundlePem, "cvip-ca-bundle.crt"), 600);
    addLog("✓ Downloaded full cryptographic materials package");
  };

  const clearCachedKeys = () => {
    const storageKey = `pki_keys_${commonName}`;
    localStorage.removeItem(storageKey);
    setPrivateKeyPem("");
    setCsrPem("");
    setCertPem("");
    setBundlePem("");
    setCertB64("");
    setStep(0);
    setVerificationResult(null);
    addLog("✓ Cleared local cached key pair");
  };

  const stepLabels = ["Idle", "Key Gen", "CSR Gen", "API Call", "Done"];
  const stepColors = [mqttTheme.muted, mqttTheme.warning, mqttTheme.primary, "#9333EA", mqttTheme.success];

  return (
    <VStack align="stretch" spacing={6}>
      <Text fontSize="20px" fontWeight="bold" color={mqttTheme.text}>Device Certificates</Text>

      {/* Device Summary Header Card */}
      <Box bg={mqttTheme.cardBg} p={5} borderRadius="12px" border={`1px solid ${mqttTheme.border}`} boxShadow="sm">
        <Text fontSize="14px" fontWeight="bold" color={mqttTheme.muted} mb={3} textTransform="uppercase">Active Device Identity Details</Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4} bg={mqttTheme.bg} p={4} borderRadius="md" borderLeft={`4px solid ${mqttTheme.primary}`}>
          <Box><Text fontSize="11px" color={mqttTheme.muted} textTransform="uppercase">VIN</Text><Text fontSize="14px" fontWeight="bold" color={mqttTheme.text}>{vin}</Text></Box>
          <Box><Text fontSize="11px" color={mqttTheme.muted} textTransform="uppercase">IMEI</Text><Text fontSize="14px" fontWeight="bold" color={mqttTheme.text}>{imei}</Text></Box>
          <Box><Text fontSize="11px" color={mqttTheme.muted} textTransform="uppercase">TBOX Serial / CN</Text><Text fontSize="14px" fontWeight="bold" color={mqttTheme.primary}>{commonName}</Text></Box>
        </Grid>
      </Box>

      {/* Modern Stepper Indicator */}
      <Box bg={mqttTheme.cardBg} p={5} borderRadius="12px" border={`1px solid ${mqttTheme.border}`} boxShadow="sm">
        <Text fontSize="14px" fontWeight="bold" color={mqttTheme.muted} mb={3} textTransform="uppercase">Generation Workflow Progress</Text>
        <Flex gap={2} wrap="wrap">
          {stepLabels.map((label, idx) => {
            const isCurrent = step === idx;
            const isCompleted = step > idx || step === 4;
            const isErr = step === -1;
            return (
              <Flex 
                key={label}
                flex={1}
                minW="100px"
                direction="column"
                align="center"
                justify="center"
                p={2}
                borderRadius="md"
                border={`1px solid ${isCurrent ? stepColors[idx] : isCompleted ? mqttTheme.success : mqttTheme.border}`}
                bg={isCurrent ? `${stepColors[idx]}11` : isCompleted ? `${mqttTheme.success}11` : "transparent"}
              >
                <Text fontSize="10px" color={mqttTheme.muted} textTransform="uppercase">STEP {idx + 1}</Text>
                <Text fontSize="12px" fontWeight="bold" color={isCurrent ? stepColors[idx] : isCompleted ? mqttTheme.success : mqttTheme.text}>{label}</Text>
              </Flex>
            );
          })}
        </Flex>
      </Box>

      {/* Main Operations Card */}
      <Box bg={mqttTheme.cardBg} p={6} borderRadius="12px" border={`1px solid ${mqttTheme.border}`} boxShadow="sm">
        <Text fontSize="16px" fontWeight="bold" color={mqttTheme.text} mb={4}>Certificate Actions</Text>
        
        <Flex gap={4} wrap="wrap">
          <Button 
            bg={mqttTheme.primary} 
            color="white" 
            _hover={{ bg: `${mqttTheme.primary}ee` }}
            leftIcon={<RefreshCw size={16} />}
            onClick={handleGenerate}
            isLoading={step > 0 && step < 4}
            loadingText="Generating..."
          >
            {step === 4 ? "Regenerate Keys & Certificate" : "Generate Certificate"}
          </Button>
          
          <Button 
            variant="outline"
            borderColor={mqttTheme.border}
            color={mqttTheme.text}
            leftIcon={isVerifying ? <Spinner size="sm" /> : <ShieldCheck size={16} color={mqttTheme.success} />}
            onClick={handleVerify}
            isDisabled={!certB64}
            isLoading={isVerifying}
          >
            Verify Current Certificate
          </Button>

          <Button 
            variant="outline"
            borderColor={mqttTheme.border}
            color={mqttTheme.text}
            leftIcon={<Download size={16} />}
            onClick={handleDownloadAll}
            isDisabled={step !== 4}
          >
            Download Bundle
          </Button>

          {step === 4 && (
            <Button variant="ghost" colorScheme="red" size="sm" onClick={clearCachedKeys}>
              Reset Local Keys
            </Button>
          )}
        </Flex>
      </Box>

      {/* Verification Detailed Results */}
      {verificationResult && (
        <Box bg={mqttTheme.cardBg} p={6} borderRadius="12px" border={`1px solid ${mqttTheme.border}`} boxShadow="sm">
          <Flex align="center" gap={2} mb={4}>
            <Icon as={CheckCircle2} color={mqttTheme.success} size={20} />
            <Text fontSize="16px" fontWeight="bold" color={mqttTheme.text}>Platform Certificate Verification Passed</Text>
          </Flex>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
            {Object.entries(verificationResult.checks || {}).map(([checkName, isPassed]) => (
              <Flex key={checkName} align="center" gap={2} p={2} bg={mqttTheme.bg} borderRadius="md">
                <Icon as={CheckCircle2} color={isPassed ? mqttTheme.success : mqttTheme.danger} size={16} />
                <Text fontSize="13px" fontWeight="medium" textTransform="capitalize" color={mqttTheme.text}>
                  {checkName.replace(/([A-Z])/g, " $1")} : {isPassed ? "PASSED" : "FAILED"}
                </Text>
              </Flex>
            ))}
          </Grid>
        </Box>
      )}

      {/* Terminal logs timeline */}
      <Box bg="#0F172A" p={5} borderRadius="12px" border={`1px solid #1E293B`} boxShadow="sm">
        <Flex align="center" gap={2} mb={3}>
          <Icon as={Terminal} color={mqttTheme.primary} />
          <Text fontSize="14px" fontWeight="bold" color="#94A3B8" textTransform="uppercase">Cryptographic Console Logs</Text>
        </Flex>
        
        <Box maxH="200px" overflowY="auto" fontFamily="monospace" fontSize="12px" color="#38BDF8">
          {certLog.length === 0 ? (
            <Text color="#64748B">[Idle] Waiting for cryptographic certificate actions...</Text>
          ) : (
            certLog.map((log, index) => (
              <Text key={index} mb={1}>{log}</Text>
            ))
          )}
        </Box>
      </Box>
    </VStack>
  );
};
