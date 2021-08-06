import { VStack } from "@chakra-ui/layout";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { BigNumber } from "ethers";
import { Image } from "@chakra-ui/image";
import styles from "./manage.module.css";
import Button from "../../../components/button";
import {getAccountFraktalNFTs, createObject, getNFTobject} from '../../../utils/graphQueries';
import {shortenHash, timezone, loadSigner} from '../../../utils/helpers';
import { useWeb3Context } from '../../../contexts/Web3Context';
import { sellerClaim } from '../../../utils/contractCalls';

export default function ManageNFTView() {
  const {account, provider, contractAddress} = useWeb3Context();
  const [nftObject, setNftObject] = useState();
  const [signer, setSigner] = useState();
  const [view, setView] = useState("manage");
  const [index, setIndex] = useState();

  function getOwnershipPercenteage() {
    let obj = nftObject.balances.find(x=>x.owner.id === account.toLocaleLowerCase())
    let amount = obj.amount
    let perc = amount/100
    console.log('calculated percenteage', perc)
    return perc;
  }

  useEffect(async ()=>{
    const address = window.location.href.split('http://localhost:3000/nft/');
    const index = parseFloat(address[1].split('/manage')[0])
    if(index){
      setIndex(index)
    }
    //look if it is listed at name of the account, so to display functions of claiming
    if(account){
      let listing = await getAccountFraktalNFTs('listed_itemsId', `${account.toLocaleLowerCase()}-0x${(index+1).toString(16)}`)
      let nftObjects;
      if(listing && listing.listItems.length > 0){
        nftObjects = await createObject(listing.listItems[0].fraktal)
      }else{
        let obj = await getAccountFraktalNFTs('marketid_fraktal',index)
        console.log('obj',obj)
        nftObjects = await createObject(obj.fraktalNFTs[0])
      }
      if(nftObjects){
        setNftObject(nftObjects)
      }
    }
  },[])

  useEffect(async ()=>{
    if(provider){
      let signer = await loadSigner(provider);
      console.log('signer', signer)
      if(signer){
        setSigner(signer)
      }
    }
  },[provider])

  async function claimGains(){
    let confirm = window.confirm('Are you sure you want to claim your gains?')
    if(confirm){
      let tx = await sellerClaim(index, signer, contractAddress);
    }
  }

  const isOwned = nftObject?.owner === account?.toLocaleLowerCase();
  const listItemUrl = '/nft/'+index+'/list-item'

  const exampleNFT = {
    id: 0,
    name: "Golden Fries Cascade",
    imageURL: "/filler-image-1.png",
    artistAddress: "0x1234...5678",
    contributions: BigNumber.from(5).div(100),
    createdAt: new Date().toISOString(),
    countdown: new Date("06-25-2021"),
  };
  return (
    <VStack spacing="0" mb="12.8rem">
      <Head>
        <title>Fraktal - NFT</title>
      </Head>
      <div>
        <Link href="/">
          <div className={styles.goBack}>← back to all NFTS</div>
        </Link>
        <div className={styles.header}>{nftObject?nftObject.name:''}</div>
        <div style={{textAlign:'center', fontWeight:'bold',fontSize:'21px',color:"grey"}}>
          {nftObject?nftObject.description:''}
        </div>
        {isOwned?
          <Link href={listItemUrl}>
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <Button style={{color: 'white', background:'black', alignItems: 'center'}} >
                List item
              </Button>
            </div>
          </Link>
          :
          <div style={{textAlign: 'center', fontWeight:'bold', fontSize: '21px'}}>
            You can manage your listed item here
          </div>
        }
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "16px",
          }}
        >
          {view === "manage" || view === "offer" ? (
            <div>
              {view === "offer" && (
                <div
                  className={styles.offerContainer}
                  style={{ marginBottom: "16px" }}
                >
                  <div className={styles.offerInfo}>
                    Every holder votes and the majority decision (&gt;50%)
                    determines if the offer is accepted
                  </div>
                  <div className={styles.offerText}>
                    A buyer has offered 10 ETH for this NFT
                  </div>
                  <div className={styles.offerCTAContainer}>
                    <Button
                      isOutlined
                      style={{
                        color: "#00C4B8",
                        borderColor: "#00C4B8",
                        width: "192px",
                        marginRight: "16px",
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      isOutlined
                      style={{
                        color: "#FF0000",
                        borderColor: "#FF0000",
                        width: "192px",
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div className={styles.redeemContainer}>
                  <div style={{ marginLeft: "24px" }}>
                    <div className={styles.redeemHeader}>OWNERSHIP</div>
                    <div className={styles.redeemAmount}>
                    {nftObject? getOwnershipPercenteage()+'%' : null}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Image src={"/info.svg"} style={{ marginRight: "8px" }} />
                    <div className={styles.redeemCTA}>Redeem NFT</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontWeight: 500 }}>
              The offer for 10 ETH has been accepted. Your share is 50%
            </div>
          )}
        </div>

        <div className={styles.content}>
          {view === "accepted" ? (
            <div className={styles.claimContainer}>
              <div style={{ marginLeft: "24px" }}>
                <div className={styles.redeemHeader}>ETH</div>
                <div className={styles.redeemAmount}>5.00</div>
              </div>

              <div
                className={styles.redeemCTA}
                style={{ backgroundColor: "#000" }}
              >
                Claim
              </div>
            </div>
          ) : (
            <div className={styles.CTAsContainer}>
              <Button
                isOutlined
                style={{
                  backgroundColor: "white",
                  marginRight: "16px",
                  width: "192px",
                }}
              >
                Deposit Revenue
              </Button>
              <Button
                isOutlined
                style={{ backgroundColor: "white", width: "192px" }}
              >
                Claim Revenue
              </Button>
            </div>
          )}
          <Image
            src={nftObject?nftObject.imageURL:exampleNFT.imageURL}
            w={"320px"}
            h={"320px"}
            borderRadius="4px"
          />
        </div>
      </div>
    </VStack>
  );
}
