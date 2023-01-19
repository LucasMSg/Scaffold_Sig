import { useContractReader } from "eth-hooks";
import { Link } from "react-router-dom";
import { Button, Card, Divider, Form, Input, List, Progress } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { getRPCPollTime } from "../helpers";
import { create } from "ipfs-http-client";
import { utils } from "ethers";
import { Address } from "../components";

const { ethers } = require("ethers");

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client

function EscrowView({
  yourLocalBalance,
  readContracts,
  signer,
  tx,
  writeContracts,
  localProvider,
  contractConfig,
  blockExplorer,
  mainnetProvider,
  address,
}) {
  // you can also use hooks locally in your component of choice
  // in this case, let's keep track of 'purpose' variable from our contract

  const [uri, setUri] = useState();
  const [to, setTo] = useState();
  const [signatures, setSignatures] = useState("");
  const [voucherSigner, setVoucherSigner] = useState("");
  const [imageRender, setImageRender] = useState();

  const [tokenAdd, setTokenAdd] = useState();
  const [tokenId, setTokenId] = useState();
  const [timeLock, setTimeLock] = useState();

  const [yourCollectibles, setYourCollectibles] = useState();
  const [escrowCollectibles, setEscrowCollectibles] = useState();

  //const tokenSignatures = new Map();
  const [tokenSignatures, setTokenSignatures] = useState("");
  const [proposals, setProposals] = useState("");

  const [EscrowAdd, setEscrowAdd] = useState("");

  const escrowBalance = useContractReader(readContracts, "ERC721Mintable", "balanceOf", [EscrowAdd]);
  const userBalance = useContractReader(readContracts, "ERC721Mintable", "balanceOf", [address]);

  useEffect(() => {
    async function getEscrowAddress() {
      if (readContracts.Escrow) {
        const escrowAddress = await readContracts.Escrow.address;
        setEscrowAdd(escrowAddress);
      }
    }
    getEscrowAddress();
  }, [EscrowAdd, readContracts]);

  useEffect(() => {
    const updateEscrowCollectibles = async () => {
      const escrowCollectibleUpdate = [];
      for (let tokenIndex = 0; tokenIndex < escrowBalance; tokenIndex++) {
        try {
          console.log("Getting token index", tokenIndex);
          const tokenId = await readContracts.ERC721Mintable.tokenOfOwnerByIndex(
            readContracts.Escrow.address,
            tokenIndex,
          );

          try {
            escrowCollectibleUpdate.push({
              id: tokenId,
              owner: readContracts.Escrow.address /* , uri: tokenURI, owner: address, ...jsonManifest */,
            });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setEscrowCollectibles(escrowCollectibleUpdate);
    };
    updateEscrowCollectibles();
  }, [escrowBalance, readContracts]);

  useEffect(() => {
    const updateYourCollectibles = async () => {
      const collectibleUpdate = [];
      for (let tokenIndex = 0; tokenIndex < userBalance; tokenIndex++) {
        try {
          console.log("Getting token index", tokenIndex);
          const tokenId = await readContracts.ERC721Mintable.tokenOfOwnerByIndex(address, tokenIndex);

          try {
            collectibleUpdate.push({
              id: tokenId,
              owner: address /* , uri: tokenURI, owner: address, ...jsonManifest */,
            });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourCollectibles(collectibleUpdate);
    };
    updateYourCollectibles();
  }, [userBalance, readContracts, address]);

  return (
    <div>
      {!userBalance ? (
        <div style={{ margin: 32 }}>
          <h2>nothing</h2>
        </div>
      ) : (
        <div style={{ margin: 32 }}>
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            {"User tokens: " + userBalance.toNumber()}
          </span>
          <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
            <List
              bordered
              dataSource={yourCollectibles}
              renderItem={item => {
                const id = item.id.toNumber();
                return (
                  <List.Item key={id /*+ "_" + item.uri + "_" + item.owner */}>
                    <Card
                      title={
                        <div>
                          <span style={{ fontSize: 16, marginRight: 8 }}>{"Token"}</span> #{id /* item.name */}
                        </div>
                      }
                    ></Card>
                    {
                      <div>
                        Owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        {
                          <Button
                            onClick={async () => {
                              const result = await tx(
                                writeContracts.ERC721Mintable.approve(readContracts.Escrow.address, id),
                              );
                              console.log(result);
                            }}
                          >
                            Escrow Approve
                          </Button>
                        }
                        <h2>Sign proposal</h2>
                        <Divider />
                        <label>Set Timelock</label>
                        <Input
                          onChange={e => {
                            setTimeLock(e.target.value);
                          }}
                        />
                        <Button
                          style={{ marginTop: 8 }}
                          onClick={async () => {
                            const escrowContract = await readContracts.Escrow.address;
                            const rentingContract = await readContracts.Renting.address;
                            const chainId = await signer.getChainId();
                            const tokenAdd = await readContracts.ERC721Mintable.address;
                            console.log(typeof timeLock);
                            //const timeLock_string = timeLock.split(",");
                            const timeLock_string = [1, 7, 30];
                            console.log("hashed values");
                            console.log(tokenAdd);
                            console.log(id);
                            const hashedTokenId = ethers.utils.solidityKeccak256(
                              ["bytes"],
                              [ethers.utils.solidityPack(["address", "uint"], [tokenAdd, id])],
                            );
                            const hashedTimes = ethers.utils.solidityKeccak256(
                              ["bytes"],
                              [ethers.utils.solidityPack(["uint[]"], [timeLock_string /* [1, 2, 3] */])],
                            );
                            console.log("hashed token id");
                            console.log(hashedTokenId);
                            console.log("hashed times result");
                            console.log(hashedTimes);
                            console.log("signer add");
                            console.log(signer.address);
                            console.log("owner add");
                            console.log(item.owner);
                            console.log("chain id");
                            console.log(chainId);
                            console.log("feature add");
                            console.log(rentingContract);

                            const domain = {
                              name: "Escrow Signature",
                              version: "1.0",
                              chainId: chainId,
                              verifyingContract: escrowContract,
                            };
                            const types = {
                              EscrowToken: [
                                { name: "feature", type: "address" },
                                { name: "timeMax", type: "bytes32" },
                                { name: "tokenID", type: "bytes32" },
                              ],
                            };
                            const message = {
                              feature: rentingContract,
                              timeMax: hashedTimes,
                              tokenID: hashedTokenId,
                            };

                            const signature = await signer._signTypedData(domain, types, message);
                            console.log(signature);
                            setTokenSignatures(signature);
                            const sig = ethers.utils.splitSignature(signature);
                            console.log("split signature");
                            console.log("v");
                            console.log(sig.v);
                            console.log("r");
                            console.log(sig.r);
                            console.log("s");
                            console.log(sig.s);
                            const newList = [...proposals];
                            let prop = {
                              id: hashedTokenId,
                              owner: item.owner,
                              times: timeLock_string,
                              tokenId: id,
                              contract: tokenAdd,
                              signature: signature,
                            };
                            newList.push(prop);
                            setProposals(newList);
                          }}
                        >
                          Sign
                        </Button>
                        {!tokenSignatures ? (
                          <div style={{ margin: 32 }}></div>
                        ) : (
                          <div style={{ margin: 32 }}>
                            <h2>📝</h2>
                          </div>
                        )}
                      </div>
                    }
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      )}
      {!proposals ? (
        <div style={{ margin: 32 }}>
          <h2>no signed proposals</h2>
        </div>
      ) : (
        <div style={{ margin: 32 }}>
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            {"Signed proposals: " + proposals.length}
          </span>
          <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
            <List
              bordered
              dataSource={proposals}
              renderItem={item => {
                const id = item.id;
                const owner = item.owner;
                const token = item.contract;
                const times = item.times;
                const signature = item.signature;
                const tokenId = item.tokenId;
                return (
                  <List.Item key={id /*+ "_" + item.uri + "_" + item.owner */}>
                    {
                      <div
                        style={{
                          border: "1px solid #cccccc",
                          padding: 16,
                          width: 400,
                          margin: "auto",
                          marginTop: 64,
                        }}
                      >
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Proposal: "}</h1> {id}
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Owner: "}</h1> {owner}
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Contract: "}</h1> {token}
                        <h1 style={{ fontSize: 16, marginRight: 8 }}>{"Times: "}</h1> {times}
                        <Divider />
                        <label>User Address</label>
                        <Input
                          onChange={e => {
                            setTokenAdd(e.target.value);
                          }}
                        />
                        <label>Time of loan</label>
                        <Input
                          onChange={e => {
                            setTokenId(e.target.value);
                          }}
                        />
                        <Button
                          style={{ marginTop: 8 }}
                          onClick={async () => {
                            const sig = ethers.utils.splitSignature(signature);
                            const tokenAdd = await readContracts.ERC721Mintable.address;
                            console.log(typeof timeLock);
                            const hashedTokenId = ethers.utils.solidityKeccak256(
                              ["bytes"],
                              [ethers.utils.solidityPack(["address", "uint"], [tokenAdd, id])],
                            );
                            console.log("split signature");
                            console.log("v");
                            console.log(sig.v);
                            console.log("r");
                            console.log(sig.r);
                            console.log("s");
                            console.log(sig.s);
                            console.log(owner);
                            console.log(tokenId);
                            console.log(times);
                            console.log("hashed id");
                            console.log(hashedTokenId);
                            console.log("user add");
                            console.log(address);
                            const rentingContract = await readContracts.Renting.address;
                            console.log("feature add");
                            console.log(rentingContract);

                            const result = await tx(
                              writeContracts.Renting.rent2(tokenAdd, address, tokenId, times, 1, sig.v, sig.r, sig.s),
                            );
                            console.log(result);

                            const newList = [];
                            for (let i = 0; i < proposals.length; i++) {
                              if (proposals[i].id != id) {
                                newList.push(proposals[i]);
                              }
                            }

                            setProposals(newList);
                          }}
                        >
                          Rent
                        </Button>
                        <p>{signatures}</p>
                      </div>
                    }
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      )}

      {/* trying to list the tokens belonging to escrow */}
      {!escrowBalance ? (
        <div style={{ margin: 32 }}>
          <h2>{EscrowAdd}</h2>
        </div>
      ) : (
        <div style={{ margin: 32 }}>
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            {"Tokens in escrow: " + escrowBalance.toNumber()}
          </span>
          <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
            <List
              bordered
              dataSource={escrowCollectibles}
              renderItem={item => {
                const id = item.id.toNumber();
                return (
                  <List.Item key={id /*+ "_" + item.uri + "_" + item.owner */}>
                    <Card
                      title={
                        <div>
                          <span style={{ fontSize: 16, marginRight: 8 }}>{"Token"}</span> #{id /* item.name */}
                        </div>
                      }
                    ></Card>
                    {
                      <div>
                        Owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        {
                          <Button
                            onClick={async () => {
                              const result = await tx(
                                writeContracts.ERC721Mintable.approve(readContracts.Escrow.address, id),
                              );
                              console.log(result);
                            }}
                          >
                            Escrow Approve
                          </Button>
                        }
                        <div style={{ marginTop: 32 }}>
                          <Progress percent={50} status="active" />
                        </div>
                        <h2>{readContracts.ERC721Mintable.ownerOf(id).toString()}</h2>
                      </div>
                    }
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EscrowView;
