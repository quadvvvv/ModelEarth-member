import React, { useState, useEffect } from 'react';
import { Card, CardContent, Avatar, Typography, Grow } from '@mui/material';
import Grid from '@mui/material/Grid';
import InfiniteScroll from 'react-infinite-scroll-component';

const MemberShowcase = ({ members }) => {
  const [displayedMembers, setDisplayedMembers] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (members.length > 0) {
      loadMoreMembers(); // Load initial members when members prop is available
    }
  }, [members]);

  const loadMoreMembers = () => {
    if (displayedMembers.length >= members.length) {
      setHasMore(false);
      return;
    }

    const newMembers = members.slice(displayedMembers.length, displayedMembers.length + 10);
    setDisplayedMembers((prev) => [...prev, ...newMembers]);
  };

  return (
    <InfiniteScroll
      dataLength={displayedMembers.length}
      next={loadMoreMembers}
      hasMore={hasMore}
      loader={<h4>Loading...</h4>}
      style={{ overflow: 'hidden' }} // Ensure no overflow issue
    >
      <Grid container spacing={3}>
        {displayedMembers.map((member, index) => (
          <Grow in key={member.id} timeout={(index + 1) * 300}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Avatar alt={member.name} src={member.avatarUrl} />
                  <Typography variant="h6">{member.name}</Typography>
                  {/* Optionally include email here */}
                </CardContent>
              </Card>
            </Grid>
          </Grow>
        ))}
      </Grid>
    </InfiniteScroll>
  );
};

export default MemberShowcase;
